"use server";

import { eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { DEFAULT_GLOBALS } from "../defaults";
import { company_settings } from "../schema";
import { revalidateGlobals } from "../server/publish";
import { saveWebsiteTranslations } from "../server/website-locales";
import { saveNavigationCtas } from "../server/navigation-ctas";
import { saveHoursLabelTranslations } from "../server/hours-labels";
import {
  companySettingsSaveInput,
} from "./validation";

/**
 * Backoffice write actions for slice `settings` (S12), **admin-only** (`requireStaff
 * (["admin"])`). Globals are a singleton (insert if none, else update). Manual target
 * labels go through the core write seam; EN stays inline. Retired stats/Avantio/
 * listing fields are never changed by submitted values (ADR0075). Navigation is fixed
 * in code (ADR0074), so its legacy action authenticates and rejects without writes.
 * Globals saves revalidate their tag and each locale's layout tree.
 */

export type SettingsSaveResult =
  | { ok: true }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "server" };

function fieldErrorsFrom(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

// ── Globals (singleton) ──────────────────────────────────────────────────────
export async function saveGlobals(raw: unknown): Promise<SettingsSaveResult> {
  const staff = await requireStaff(["admin"]);

  const parsed = companySettingsSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  // Drop empty social handles. Retired fields deliberately stay out of update values.
  const social: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.social)) if (v) social[k] = v;

  const coreValues = {
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    // Old clients omit the new field: preserve its saved value (including null).
    ...(input.owners_phone === undefined ? {} : { owners_phone: input.owners_phone }),
    checkin_phone: input.checkin_phone,
    website_url: input.website_url,
    social,
    office_address: input.office_address,
    office_hours: input.office_hours,
    office_hours_label: input.office_hours_label,
    currency: input.currency,
    default_og_image_media_id: input.default_og_image_media_id,
  };

  try {
    const [existing] = await db
      .select()
      .from(company_settings)
      .orderBy(company_settings.created_at)
      .limit(1);

    let id: string;
    if (existing) {
      id = existing.id;
      await db
        .update(company_settings)
        .set({
          ...coreValues,
          site_icons: { ...existing.site_icons, ...input.site_icons },
          updated_at: new Date(),
        })
        .where(eq(company_settings.id, id));
    } else {
      const [ins] = await db
        .insert(company_settings)
        .values({
          ...coreValues,
          stats: DEFAULT_GLOBALS.stats,
          avantio_account_id: DEFAULT_GLOBALS.avantio.accountId,
          avantio_widget_config: DEFAULT_GLOBALS.avantio.widgetConfig,
          show_building_location: DEFAULT_GLOBALS.showBuildingLocation,
          show_building_count: DEFAULT_GLOBALS.showBuildingCount,
          site_icons: { ...DEFAULT_GLOBALS.icons, ...input.site_icons },
        })
        .returning({ id: company_settings.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    await saveWebsiteTranslations(id, input.website_url, input.website_translations, staff.userId);

    await saveNavigationCtas(id, input.navigation_ctas, staff.userId);

    await saveHoursLabelTranslations(id, input.office_hours_label, input.office_hours_translations, staff.userId);

    revalidateGlobals();
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

// ── Retired navigation writer (ADR0074) ────────────────────────────────────────
export async function saveNavigation(raw: unknown): Promise<SettingsSaveResult> {
  await requireStaff(["admin"]);
  void raw;
  return { ok: false, error: "validation", fieldErrors: {} };
}
