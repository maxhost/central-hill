"use server";

import { saveOwnerMediaAlts } from "@core/media/owner-alt-write";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { executeSerialized } from "@core/db/serialized";
import { HEADER_CONTACT_LOCK } from "@slices/forms/contract";
import { getAssignableHeaderForm, assignableHeaderFormGuard } from "@slices/forms/server-contract";
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
    ...(input.header_contact_form_id === undefined ? {} : { header_contact_form_id: input.header_contact_form_id }),
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    // Old clients omit the new field: preserve its saved value (including null).
    ...(input.owners_phone === undefined ? {} : { owners_phone: input.owners_phone }),
    ...(input.owners_email === undefined ? {} : { owners_email: input.owners_email }),
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
    const candidate = input.header_contact_form_id ? await getAssignableHeaderForm(input.header_contact_form_id) : null;
    const invalidSelection = (): SettingsSaveResult => ({ ok: false, error: "validation", fieldErrors: { header_contact_form_id: "Choose an available form with a valid recipient, or reload Settings." } });
    if (input.header_contact_form_id && !candidate) return invalidSelection();
    const assignmentGuard = candidate ? assignableHeaderFormGuard(candidate.id, candidate.revision) : sql`true`;
    const [existing] = await db
      .select()
      .from(company_settings)
      .orderBy(company_settings.created_at, company_settings.id)
      .limit(1);

    let id: string;
    if (existing) {
      id = existing.id;
      const saved = await executeSerialized(HEADER_CONTACT_LOCK, db
        .update(company_settings)
        .set({
          ...coreValues,
          site_icons: { ...existing.site_icons, ...input.site_icons },
          updated_at: new Date(),
        })
        .where(and(eq(company_settings.id, id), assignmentGuard))
        .returning({ id: company_settings.id }).getSQL());
      if (saved.rows.length !== 1) return invalidSelection();
    } else {
      const values = {
        ...coreValues,
        stats: DEFAULT_GLOBALS.stats,
        avantio_account_id: DEFAULT_GLOBALS.avantio.accountId,
        avantio_widget_config: DEFAULT_GLOBALS.avantio.widgetConfig,
        show_building_location: DEFAULT_GLOBALS.showBuildingLocation,
        show_building_count: DEFAULT_GLOBALS.showBuildingCount,
        site_icons: { ...DEFAULT_GLOBALS.icons, ...input.site_icons },
      };
      // The missing-singleton case is guarded in the same serialized statement.
      // Keys come only from this server-owned object, never from the request.
      const columns = Object.keys(values).map(key => sql.identifier(key));
      const entries: SQL[] = Object.values(values).map(value => value !== null && typeof value === "object" ? sql`${JSON.stringify(value)}::jsonb` : sql`${value}`);
      const saved = await executeSerialized(HEADER_CONTACT_LOCK, sql`insert into ${company_settings} (${sql.join(columns, sql`, `)})
        select ${sql.join(entries, sql`, `)} where not exists(select 1 from ${company_settings}) and ${assignmentGuard} returning id`);
      const insertedId = saved.rows[0]?.id;
      if (typeof insertedId !== "string") return invalidSelection();
      id = insertedId;
    }

    await saveWebsiteTranslations(id, input.website_url, input.website_translations, staff.userId);

    await saveNavigationCtas(id, input.navigation_ctas, staff.userId);

    await saveHoursLabelTranslations(id, input.office_hours_label, input.office_hours_translations, staff.userId);

    await saveOwnerMediaAlts("company_settings", id, input.default_og_image_media_id, input.default_og_alts, staff.userId);

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
