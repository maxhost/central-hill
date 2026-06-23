"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import {
  SlugConflictError,
  deleteContent,
  deleteSlugs,
  setSlugs,
  setSourceContent,
} from "@core/i18n/content-write";
import { BUILDING, BUILDING_FAQ } from "../contract";
import { building, building_amenity, building_faq, building_media } from "../schema";
import { revalidateBuilding } from "../server/publish";
import { type BuildingSaveInput, buildingSaveInput } from "./validation";

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

const sameSlugAllLocales = (slug: string) => ({ en: slug, pt: slug, es: slug, fr: slug });

export async function saveBuilding(raw: unknown): Promise<BuildingSaveResult> {
  const staff = await requireStaff();

  const parsed = buildingSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  const coreValues = {
    slug: input.slug,
    status: input.status,
    position: input.position,
    is_new: input.is_new,
    is_featured: input.is_featured,
    city_id: input.city_id,
    neighbourhood_id: input.neighbourhood_id,
    street_address: input.street_address,
    latitude: input.latitude,
    longitude: input.longitude,
    cover_media_id: input.cover_media_id,
    og_image_media_id: input.og_image_media_id,
    avantio_id: input.avantio_id,
    avantio_url: input.avantio_url,
    booking_enabled: input.booking_enabled,
  };

  try {
    const isCreate = !input.id;
    let id = input.id ?? "";

    if (input.id) {
      const [exists] = await db
        .select({ id: building.id })
        .from(building)
        .where(eq(building.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(building)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(building.id, input.id));
    } else {
      const [ins] = await db.insert(building).values(coreValues).returning({ id: building.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    // Slugs first — a conflict on create must not leave an orphan draft.
    try {
      await setSlugs(BUILDING, id, sameSlugAllLocales(input.slug));
    } catch (err) {
      if (err instanceof SlugConflictError) {
        if (isCreate) {
          await db.delete(building).where(eq(building.id, id));
          await deleteSlugs(BUILDING, id);
        }
        return { ok: false, error: "slug_conflict" };
      }
      throw err;
    }

    await setSourceContent(
      BUILDING,
      id,
      {
        name: input.name,
        headline: input.headline,
        teaser: input.teaser,
        description_intro: input.description_intro,
        description_neighbourhood: input.description_neighbourhood,
        meta_title: input.meta_title,
        meta_description: input.meta_description,
      },
      { updatedBy: staff.userId },
    );

    await persistGallery(id, input.gallery);
    await persistAmenities(id, input.amenity_ids);
    await persistFaq(id, input.faq, staff.userId);

    revalidateBuilding(id, sameSlugAllLocales(input.slug));
    revalidatePath("/admin/buildings");
    revalidatePath(`/admin/buildings/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteBuilding(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    // FAQ translations are polymorphic (no FK cascade) — clean them before the
    // building delete cascades the building_faq rows away.
    const faqRows = await db
      .select({ id: building_faq.id })
      .from(building_faq)
      .where(eq(building_faq.building_id, id));

    await db.delete(building).where(eq(building.id, id)); // cascades media/amenity/faq rows
    for (const f of faqRows) await deleteContent(BUILDING_FAQ, f.id);
    await deleteContent(BUILDING, id);
    await deleteSlugs(BUILDING, id);

    revalidateBuilding(id, {});
    revalidatePath("/admin/buildings");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── Relational persistence helpers ──────────────────────────────────────────

/** Replace the gallery rows with the submitted, ordered media ids. */
async function persistGallery(id: string, gallery: string[]): Promise<void> {
  await db.delete(building_media).where(eq(building_media.building_id, id));
  if (gallery.length > 0) {
    await db
      .insert(building_media)
      .values(gallery.map((mediaId, i) => ({ building_id: id, media_id: mediaId, position: i })));
  }
}

/** Replace the amenity links with the submitted set (deduped). */
async function persistAmenities(id: string, amenityIds: string[]): Promise<void> {
  await db.delete(building_amenity).where(eq(building_amenity.building_id, id));
  const unique = Array.from(new Set(amenityIds));
  if (unique.length > 0) {
    await db
      .insert(building_amenity)
      .values(unique.map((amenityId) => ({ building_id: id, amenity_id: amenityId })));
  }
}

/** Upsert FAQ rows by id (preserving translations), drop the removed ones. */
async function persistFaq(
  id: string,
  faq: BuildingSaveInput["faq"],
  updatedBy: string,
): Promise<void> {
  const existing = await db
    .select({ id: building_faq.id })
    .from(building_faq)
    .where(eq(building_faq.building_id, id));
  const existingIds = new Set(existing.map((r) => r.id));
  const kept = new Set<string>();

  for (let i = 0; i < faq.length; i++) {
    const item = faq[i]!;
    let faqId = item.id && existingIds.has(item.id) ? item.id : null;
    if (faqId) {
      await db
        .update(building_faq)
        .set({ position: i, updated_at: new Date() })
        .where(eq(building_faq.id, faqId));
    } else {
      const [ins] = await db
        .insert(building_faq)
        .values({ building_id: id, position: i })
        .returning({ id: building_faq.id });
      if (!ins) continue;
      faqId = ins.id;
    }
    kept.add(faqId);
    await setSourceContent(
      BUILDING_FAQ,
      faqId,
      { question: item.question, answer: item.answer },
      { updatedBy },
    );
  }

  for (const exId of existingIds) {
    if (!kept.has(exId)) {
      await db.delete(building_faq).where(eq(building_faq.id, exId));
      await deleteContent(BUILDING_FAQ, exId);
    }
  }
}
