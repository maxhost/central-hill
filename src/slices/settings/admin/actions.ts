"use server";

import { eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { deleteContent, setSourceContent } from "@core/i18n/content-write";
import { COMPANY_SETTINGS, NAV_ITEM, type StatKey } from "../contract";
import { company_settings, nav_item } from "../schema";
import { revalidateGlobals, revalidateNav } from "../server/publish";
import {
  type NavigationSaveInput,
  companySettingsSaveInput,
  navigationSaveInput,
} from "./validation";

/**
 * Backoffice write actions for slice `settings` (S12), **admin-only** (`requireStaff
 * (["admin"])`). Globals are a singleton (insert if none, else update). The source [T]
 * labels (stat labels + office-hours label, nav labels) go through the `core/i18n`
 * write seam (ADR 0019); scalars/jsonb are written as columns. Nav items are upserted
 * by id so approved label translations survive an edit; removed ones are purged. On
 * success the `globals`/`nav` tags + each locale's layout tree are revalidated.
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

    revalidateGlobals();
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

// ── Navigation ─────────────────────────────────────────────────────────────────
export async function saveNavigation(raw: unknown): Promise<SettingsSaveResult> {
  const staff = await requireStaff(["admin"]);

  const parsed = navigationSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  try {
    const existing = await db.select({ id: nav_item.id }).from(nav_item);
    const existingIds = new Set(existing.map((r) => r.id));
    const kept = new Set<string>();

    await persistLocation("header", input.header, existingIds, kept, staff.userId);
    await persistLocation("footer", input.footer, existingIds, kept, staff.userId);

    for (const exId of existingIds) {
      if (!kept.has(exId)) {
        await db.delete(nav_item).where(eq(nav_item.id, exId));
        await deleteContent(NAV_ITEM, exId);
      }
    }

    revalidateNav();
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

/** Upsert one location's top-level items + their children, recording kept ids. */
async function persistLocation(
  location: "header" | "footer",
  items: NavigationSaveInput["header"],
  existingIds: Set<string>,
  kept: Set<string>,
  updatedBy: string,
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const parentId = await upsertNavItem(location, null, i, item.id, item.url, item.label, existingIds, kept, updatedBy);
    if (!parentId) continue;
    for (let j = 0; j < item.children.length; j++) {
      const child = item.children[j]!;
      await upsertNavItem(location, parentId, j, child.id, child.url, child.label, existingIds, kept, updatedBy);
    }
  }
}

/** Update an existing nav item (by known id) or insert a new one; returns its id. */
async function upsertNavItem(
  location: "header" | "footer",
  parentId: string | null,
  position: number,
  id: string | undefined,
  url: string,
  label: string,
  existingIds: Set<string>,
  kept: Set<string>,
  updatedBy: string,
): Promise<string | null> {
  let navId = id && existingIds.has(id) ? id : null;
  if (navId) {
    await db
      .update(nav_item)
      .set({ location, parent_id: parentId, position, url, updated_at: new Date() })
      .where(eq(nav_item.id, navId));
  } else {
    const [ins] = await db
      .insert(nav_item)
      .values({ location, parent_id: parentId, position, url })
      .returning({ id: nav_item.id });
    if (!ins) return null;
    navId = ins.id;
  }
  kept.add(navId);
  await setSourceContent(NAV_ITEM, navId, { label }, { updatedBy });
  return navId;
}
