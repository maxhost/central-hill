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
import { loadContent } from "@core/i18n/content";
import { saveGeographyNames } from "../server/reference-names";
import { CITY, NEIGHBOURHOOD } from "../contract";
import { city, neighbourhood } from "../schema";
import { revalidateCity } from "../server/publish";
import { type CitySaveInput, citySaveInput } from "./validation";

/**
 * Backoffice write actions for slice `geography` (S12). A city is saved together with
 * its neighbourhoods. Creates and explicit shared-slug edits initialize all locale
 * URLs (ADR 0019); name-only updates preserve prior URLs. Four authored names use
 * the `core/i18n` write seam (ADR 0069). Neighbourhoods are upserted by id so approved translations survive an
 * edit; removed ones have their rows, translations and slugs cleaned. On success the
 * geography caches are busted via `revalidateCity` (cascades buildings/guides/pages).
 */

export type CitySaveResult =
  | { ok: true; id: string; neighbourhoodIds?: string[] }
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

export async function saveCity(raw: unknown): Promise<CitySaveResult> {
  const staff = await requireStaff();

  const parsed = citySaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  const coreValues = {
    slug: input.slug,
    position: input.position,
    status: input.status,
    country: input.country,
    hero_media_id: input.hero_media_id,
  };

  try {
    const isCreate = !input.id;
    let id = input.id ?? "";
    let previousSlug: string | undefined;
    let previousIntro: string | null = null;

    if (input.id) {
      const [exists] = await db
        .select({ id: city.id, slug: city.slug })
        .from(city)
        .where(eq(city.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      previousSlug = exists.slug;
      const content = await loadContent([{ type: CITY, id: input.id }], "en");
      previousIntro = content.get(CITY, input.id, "intro")?.trim() || null;
      await db
        .update(city)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(city.id, input.id));
    } else {
      const [ins] = await db.insert(city).values(coreValues).returning({ id: city.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    // Slugs first (city + neighbourhoods) — a conflict on create must not orphan.
    let neighbourhoodIds: string[];
    try {
      if (isCreate || previousSlug !== input.slug) {
        await setSlugs(CITY, id, sameSlugAllLocales(input.slug));
      }
      neighbourhoodIds = await persistNeighbourhoods(id, input.neighbourhoods, staff.userId);
    } catch (err) {
      if (err instanceof SlugConflictError) {
        if (isCreate) await purgeCity(id);
        return { ok: false, error: "slug_conflict" };
      }
      throw err;
    }

    await saveGeographyNames(CITY, id, input, staff.userId);
    const intro = input.intro?.trim() || null;
    if (isCreate || intro !== previousIntro) {
      await setSourceContent(CITY, id, { intro }, {
        updatedBy: staff.userId, preserveTargetsOnClear: true,
      });
    }

    revalidateCity(id);
    revalidatePath("/admin/cities");
    revalidatePath(`/admin/cities/${id}`);
    revalidatePath("/admin/buildings", "layout");
    revalidatePath("/admin/guides", "layout");
    return { ok: true, id, neighbourhoodIds };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteCity(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    await purgeCity(id);
    revalidateCity(id);
    revalidatePath("/admin/cities");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Remove a city, its neighbourhoods (FK cascade), and all their translations/slugs. */
async function purgeCity(id: string): Promise<void> {
  const nbRows = await db
    .select({ id: neighbourhood.id })
    .from(neighbourhood)
    .where(eq(neighbourhood.city_id, id));

  await db.delete(city).where(eq(city.id, id)); // cascades neighbourhood rows
  for (const n of nbRows) {
    await deleteContent(NEIGHBOURHOOD, n.id);
    await deleteSlugs(NEIGHBOURHOOD, n.id);
  }
  await deleteContent(CITY, id);
  await deleteSlugs(CITY, id);
}

/** Upsert neighbourhoods by id (preserving translations), drop the removed ones. */
async function persistNeighbourhoods(
  cityId: string,
  neighbourhoods: CitySaveInput["neighbourhoods"],
  updatedBy: string,
): Promise<string[]> {
  const existing = await db
    .select({ id: neighbourhood.id, slug: neighbourhood.slug })
    .from(neighbourhood)
    .where(eq(neighbourhood.city_id, cityId));
  const existingIds = new Set(existing.map((r) => r.id));
  const kept = new Set<string>();
  const ids: string[] = [];
  const previousSlugs = new Map(existing.map((row) => [row.id, row.slug]));

  for (let i = 0; i < neighbourhoods.length; i++) {
    const item = neighbourhoods[i]!;
    let nbId = item.id && existingIds.has(item.id) ? item.id : null;
    if (nbId) {
      await db
        .update(neighbourhood)
        .set({ slug: item.slug, position: i, updated_at: new Date() })
        .where(eq(neighbourhood.id, nbId));
    } else {
      const [ins] = await db
        .insert(neighbourhood)
        .values({ city_id: cityId, slug: item.slug, position: i })
        .returning({ id: neighbourhood.id });
      if (!ins) throw new Error("Neighbourhood insert returned no identity");
      nbId = ins.id;
    }
    kept.add(nbId);
    ids.push(nbId);
    if (previousSlugs.get(nbId) !== item.slug) {
      await setSlugs(NEIGHBOURHOOD, nbId, sameSlugAllLocales(item.slug));
    }
    await saveGeographyNames(NEIGHBOURHOOD, nbId, item, updatedBy);
  }

  for (const exId of existingIds) {
    if (!kept.has(exId)) {
      await db.delete(neighbourhood).where(eq(neighbourhood.id, exId));
      await deleteContent(NEIGHBOURHOOD, exId);
      await deleteSlugs(NEIGHBOURHOOD, exId);
    }
  }
  return ids;
}
