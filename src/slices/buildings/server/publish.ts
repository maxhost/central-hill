import "server-only";
import type { Locale } from "@core/db/columns";
import { cacheTags, revalidatePath, updateTag } from "@core/revalidate";
import { BUILDING_TAGS } from "../contract";

/**
 * Single place that busts building ISR caches on publish (conventions.md → "don't
 * scatter revalidateTag calls"). Building admin actions (S12) call these after a
 * successful persist + translation enqueue; the apartments slice (S3) also calls
 * `revalidateBuilding` when it recomputes a building's denormalized stats on
 * apartment publish. Listing/featured reads are tagged `building-list`; per-building
 * detail also gets `building:<id>`.
 */
const LOCALES: Locale[] = ["en", "pt", "es", "fr"];

/** Bust the listing + featured reads + the localized buildings index paths. */
export function revalidateBuildingList(): void {
  updateTag(BUILDING_TAGS.list);
  updateTag(cacheTags.sitemap);
  for (const locale of LOCALES) revalidatePath(`/${locale}/buildings`);
}

/**
 * Bust a single building + the listing. Pass the per-locale slugs so each localized
 * detail path is revalidated too.
 */
export function revalidateBuilding(
  id: string,
  slugByLocale: Partial<Record<Locale, string>>,
): void {
  updateTag(BUILDING_TAGS.building(id));
  revalidateBuildingList();
  for (const locale of LOCALES) {
    const slug = slugByLocale[locale];
    if (slug) revalidatePath(`/${locale}/buildings/${slug}`);
  }
}
