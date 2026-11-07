"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { deleteBuildingIdentityIfUnused } from "../server/editorial-store";
import {
  buildingSlugMap,
  propertyGraphLockQuery,
} from "../server/editorial-bootstrap";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { deleteContent, deleteSlugs } from "@core/i18n/content-write";
import { AMENITY, BUILDING, BUILDING_FAQ } from "../contract";
import { amenity, building_faq } from "../schema";
import { revalidateBuilding, revalidateBuildingList } from "../server/publish";
import { amenitySaveInput } from "./validation";
import { saveAmenityLabels } from "../server/amenity-labels";

/**
 * Backoffice write actions for slice `buildings` (S12). Each re-gates with
 * `requireStaff()` (defence in depth) and re-validates with `buildingSaveInput`.
 * Source [T] content + per-locale slugs go through the `core/i18n` write seam
 * (ADR 0019); the building-owned relational tables (gallery / amenities / FAQ) are
 * written directly. On success the ISR caches are busted via `revalidateBuilding`
 * and the dynamic admin routes via `revalidatePath`.
 *
 * Slugs are written identically across the four locales for reachability; localized
 * slugs are a later editor refinement (ADR 0019). FAQ rows are upserted by id so
 * approved translations survive an edit; removed rows have their translations
 * cleaned up (the tables are polymorphic — no FK cascade from the entity).
 */

export type BuildingSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "slug_conflict" }
  | { ok: false; error: "not_found" }
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

/** Retired: all Building content now belongs to the per-locale editor. */
export async function saveBuilding(_raw: unknown): Promise<BuildingSaveResult> {
  await requireStaff();
  void _raw;
  return {
    ok: false,
    error: "validation",
    fieldErrors: {
      _source: "Use the building language editor to save a draft or publish.",
    },
  };
}
export async function deleteBuilding(
  id: string,
): Promise<{ ok: boolean; error?: "in_use" | "not_found" }> {
  await requireStaff();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "not_found" };
  try {
    const slugs = await buildingSlugMap(id);
    const faqRows = await db
      .select({ id: building_faq.id })
      .from(building_faq)
      .where(eq(building_faq.building_id, id));
    const result = await deleteBuildingIdentityIfUnused(id);
    if (!result.ok) return result;
    for (const f of faqRows) await deleteContent(BUILDING_FAQ, f.id);
    await deleteContent(BUILDING, id);
    await deleteSlugs(BUILDING, id);
    revalidateBuilding(id, slugs);
    revalidatePath("/admin/buildings");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── Amenity taxonomy (`/admin/amenities`) ────────────────────────────────────
/**
 * Create/update one amenity. `slug`/`icon`/`group` are plain columns; the [T] `label`
 * goes through the source/manual-target write seams. The slug has no DB unique index, so a
 * duplicate is refused here (`slug_conflict`). Every public building read (listing +
 * detail) carries `BUILDING_TAGS.list`, so `revalidateBuildingList` refreshes the
 * amenity grids of all buildings that list it.
 */
export async function saveAmenity(raw: unknown): Promise<BuildingSaveResult> {
  const staff = await requireStaff();

  const parsed = amenitySaveInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }
  const input = parsed.data;

  const coreValues = { slug: input.slug, icon: input.icon, group: input.group };

  try {
    const [clash] = await db
      .select({ id: amenity.id })
      .from(amenity)
      .where(
        input.id
          ? and(eq(amenity.slug, input.slug), ne(amenity.id, input.id))
          : eq(amenity.slug, input.slug),
      )
      .limit(1);
    if (clash) return { ok: false, error: "slug_conflict" };

    let id = input.id ?? "";
    if (input.id) {
      const [exists] = await db
        .select({ id: amenity.id })
        .from(amenity)
        .where(eq(amenity.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(amenity)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(amenity.id, input.id));
    } else {
      const [ins] = await db
        .insert(amenity)
        .values(coreValues)
        .returning({ id: amenity.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    await saveAmenityLabels(id, input, staff.userId);

    revalidateBuildingList();
    revalidatePath("/admin/amenities");
    revalidatePath(`/admin/amenities/${id}`);
    revalidatePath("/admin/buildings", "layout");
    revalidatePath("/admin/buildings/[id]", "layout");
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

/**
 * Delete one amenity. `building_amenity` rows cascade (it disappears from every
 * building that listed it); its translations are polymorphic, so they're cleaned here.
 */
export async function deleteAmenity(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    if (!z.uuid().safeParse(id).success) return { ok: false };
    const [, result] = await db.batch([
      propertyGraphLockQuery(),
      db.execute(
        sql`delete from amenity where id=${id}::uuid and not exists(select 1 from building_locale_content where coalesce(draft->'content'->'amenity_ids','[]'::jsonb) ? ${id} or coalesce(published->'content'->'amenity_ids','[]'::jsonb) ? ${id}) returning id`,
      ),
    ]);
    if (!result.rows.length) return { ok: false };
    await deleteContent(AMENITY, id);

    revalidateBuildingList();
    revalidatePath("/admin/amenities");
    revalidatePath("/admin/buildings");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
