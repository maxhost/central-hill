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
import { APARTMENT } from "../contract";
import { apartment, apartment_media } from "../schema";
import { revalidateApartment } from "../server/publish";
import { recomputeBuildingStats } from "../server/stats";
import { type ApartmentSaveInput, apartmentSaveInput } from "./validation";

/**
 * Backoffice write actions for slice `apartments` (S12). `requireStaff`-gated +
 * re-validated. Source [T] content + slugs via the `core/i18n` write seam (ADR 0019);
 * the gallery is written here. After any change to the published set the parent
 * building's denormalized stats are recomputed (and the old building's too, on a
 * reassignment) and the ISR caches busted via `revalidateApartment`.
 */

export type ApartmentSaveResult =
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

export async function saveApartment(raw: unknown): Promise<ApartmentSaveResult> {
  const staff = await requireStaff();

  const parsed = apartmentSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  const coreValues = {
    slug: input.slug,
    status: input.status,
    position: input.position,
    building_id: input.building_id,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    max_guests: input.max_guests,
    beds_count: input.beds_count,
    size_m2: input.size_m2,
    floor: input.floor,
    cover_media_id: input.cover_media_id,
    og_image_media_id: input.og_image_media_id,
    avantio_id: input.avantio_id,
    avantio_url: input.avantio_url,
  };

  try {
    const isCreate = !input.id;
    let id = input.id ?? "";
    let previousBuildingId: string | null = null;

    if (input.id) {
      const [existing] = await db
        .select({ id: apartment.id, building_id: apartment.building_id })
        .from(apartment)
        .where(eq(apartment.id, input.id))
        .limit(1);
      if (!existing) return { ok: false, error: "not_found" };
      previousBuildingId = existing.building_id;
      await db
        .update(apartment)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(apartment.id, input.id));
    } else {
      const [ins] = await db.insert(apartment).values(coreValues).returning({ id: apartment.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    try {
      await setSlugs(APARTMENT, id, sameSlugAllLocales(input.slug));
    } catch (err) {
      if (err instanceof SlugConflictError) {
        if (isCreate) {
          await db.delete(apartment).where(eq(apartment.id, id));
          await deleteSlugs(APARTMENT, id);
        }
        return { ok: false, error: "slug_conflict" };
      }
      throw err;
    }

    await setSourceContent(
      APARTMENT,
      id,
      {
        name: input.name,
        badge: input.badge,
        description: input.description,
        meta_title: input.meta_title,
        meta_description: input.meta_description,
      },
      { updatedBy: staff.userId },
    );

    await persistGallery(id, input.gallery);

    // Recompute stats for the (possibly changed) building set.
    await recomputeBuildingStats(input.building_id);
    if (previousBuildingId && previousBuildingId !== input.building_id) {
      await recomputeBuildingStats(previousBuildingId);
      revalidateApartment(id, previousBuildingId);
    }

    revalidateApartment(id, input.building_id);
    revalidatePath("/admin/apartments");
    revalidatePath(`/admin/apartments/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteApartment(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    const [row] = await db
      .select({ building_id: apartment.building_id })
      .from(apartment)
      .where(eq(apartment.id, id))
      .limit(1);

    await db.delete(apartment).where(eq(apartment.id, id)); // cascades apartment_media
    await deleteContent(APARTMENT, id);
    await deleteSlugs(APARTMENT, id);

    if (row) {
      await recomputeBuildingStats(row.building_id);
      revalidateApartment(id, row.building_id);
    }
    revalidatePath("/admin/apartments");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Replace the gallery rows with the submitted, ordered media ids. */
async function persistGallery(id: string, gallery: ApartmentSaveInput["gallery"]): Promise<void> {
  await db.delete(apartment_media).where(eq(apartment_media.apartment_id, id));
  if (gallery.length > 0) {
    await db
      .insert(apartment_media)
      .values(gallery.map((mediaId, i) => ({ apartment_id: id, media_id: mediaId, position: i })));
  }
}
