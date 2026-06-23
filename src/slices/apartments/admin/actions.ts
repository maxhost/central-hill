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
import { apartment } from "../schema";
import { revalidateApartment } from "../server/publish";
import { recomputeBuildingStats } from "../server/stats";
import { apartmentSaveInput } from "./validation";

/**
 * Backoffice write actions for slice `apartments` (S12). `requireStaff`-gated +
 * re-validated. Source [T] content (name, badge) + slugs via the `core/i18n` write
 * seam (ADR 0019). After any change to the published set the parent building's
 * denormalized stats are recomputed (and the old building's too, on a reassignment)
 * and the ISR caches busted via `revalidateApartment`.
 *
 * The per-locale slug is **auto-generated** from the name (the editor no longer asks
 * for one — a unit has no standalone public URL, so the slug is an internal identity
 * key only). On create we suffix it with the new id's short hash if the base form is
 * already taken, which makes a collision effectively impossible; on edit the existing
 * slug is left untouched so it stays stable.
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

/** Kebab-case, url-safe slug derived from a name (matches the `slug` primitive). */
function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (á → a)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
  return base || "apartment";
}

export async function saveApartment(raw: unknown): Promise<ApartmentSaveResult> {
  const staff = await requireStaff();

  const parsed = apartmentSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  // Card-only columns. Dropped fields (bathrooms / size_m2 / floor / og_image) keep
  // their DB defaults (0) or stay null — they are no longer authored in the editor.
  const coreValues = {
    status: input.status,
    position: input.position,
    building_id: input.building_id,
    bedrooms: input.bedrooms,
    max_guests: input.max_guests,
    beds_count: input.beds_count,
    cover_media_id: input.cover_media_id,
    avantio_id: input.avantio_id,
    avantio_url: input.avantio_url,
  };

  try {
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
      // Slug is immutable post-create (internal identity only) — leave it as-is.
      await db
        .update(apartment)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(apartment.id, input.id));
    } else {
      const base = slugify(input.name);
      const [ins] = await db
        .insert(apartment)
        .values({ ...coreValues, slug: base })
        .returning({ id: apartment.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;

      // Register the slug for all locales; on collision, suffix with the id's short
      // hash (now known) so the retry is guaranteed unique.
      try {
        await setSlugs(APARTMENT, id, sameSlugAllLocales(base));
      } catch (err) {
        if (err instanceof SlugConflictError) {
          const unique = `${base}-${id.slice(0, 8)}`;
          await db.update(apartment).set({ slug: unique }).where(eq(apartment.id, id));
          await setSlugs(APARTMENT, id, sameSlugAllLocales(unique));
        } else {
          throw err;
        }
      }
    }

    await setSourceContent(
      APARTMENT,
      id,
      {
        name: input.name,
        badge: input.badge,
      },
      { updatedBy: staff.userId },
    );

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
