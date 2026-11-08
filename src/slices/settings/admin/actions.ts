"use server";

import { eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { setSourceContent } from "@core/i18n/content-write";
import { COMPANY_SETTINGS, type StatKey } from "../contract";
import { company_settings } from "../schema";
import { revalidateGlobals } from "../server/publish";
import { saveWebsiteTranslations } from "../server/website-locales";
import { saveNavigationCtas } from "../server/navigation-ctas";
import {
  companySettingsSaveInput,
} from "./validation";

/**
 * Backoffice write actions for slice `settings` (S12), **admin-only** (`requireStaff
 * (["admin"])`). Globals are a singleton (insert if none, else update). The source [T]
 * labels (stat labels + office-hours label) go through the `core/i18n`
 * write seam (ADR 0019); scalars/jsonb are written as columns. Navigation is fixed
 * in code (ADR0074), so its legacy action authenticates and rejects without writes.
 * Globals saves revalidate their tag and each locale's layout tree.
 */

const STAT_KEYS: StatKey[] = ["bookings", "years", "guests", "revenue", "buildings", "apartments"];

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

  // jsonb columns: drop empty social handles; keep stat value + (source) label.
  const social: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.social)) if (v) social[k] = v;

  const stats: Record<string, { value: string; label: string }> = {};
  for (const key of STAT_KEYS) stats[key] = { value: input.stats[key].value, label: input.stats[key].label };

  const coreValues = {
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    // Old clients omit the new field: preserve its saved value (including null).
    ...(input.owners_phone === undefined ? {} : { owners_phone: input.owners_phone }),
    checkin_phone: input.checkin_phone,
    website_url: input.website_url,
    social,
    stats,
    office_address: input.office_address,
    office_hours: input.office_hours,
    office_hours_label: input.office_hours_label,
    currency: input.currency,
    default_og_image_media_id: input.default_og_image_media_id,
    avantio_account_id: input.avantio_account_id,
    avantio_widget_config: input.avantio_widget_config,
    show_building_location: input.show_building_location,
    show_building_count: input.show_building_count,
    site_icons: input.site_icons,
  };

  try {
    const [existing] = await db
      .select({ id: company_settings.id })
      .from(company_settings)
      .orderBy(company_settings.created_at)
      .limit(1);

    let id: string;
    if (existing) {
      id = existing.id;
      await db
        .update(company_settings)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(company_settings.id, id));
    } else {
      const [ins] = await db
        .insert(company_settings)
        .values(coreValues)
        .returning({ id: company_settings.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    const labelFields: Record<string, string> = {};
    for (const key of STAT_KEYS) labelFields[`stats.${key}.label`] = input.stats[key].label;
    labelFields.office_hours_label = input.office_hours_label ?? "";
    await setSourceContent(COMPANY_SETTINGS, id, labelFields, { updatedBy: staff.userId });

    await saveWebsiteTranslations(id, input.website_url, input.website_translations, staff.userId);

    await saveNavigationCtas(id, input.navigation_ctas, staff.userId);

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
