import "server-only";
import { cacheTags, updateTag } from "@core/revalidate";
import { GEO_TAGS } from "../contract";

/**
 * Single place that busts geography ISR caches on publish (conventions.md → "don't
 * scatter revalidateTag calls"). The geography admin actions (S12) call this after a
 * successful persist + translation enqueue.
 *
 * Geography has no public routes of its own, so there are no paths to revalidate
 * here. Its data is *embedded* in downstream slices (buildings cards, guide heroes,
 * page teasers); those reads subscribe to `GEO_TAGS.list` (see contract) and to the
 * sitemap tag, so busting them here cascades the refresh. Buildings/guides also call
 * their own publish helpers when their content changes.
 */
export function revalidateGeography(): void {
  updateTag(GEO_TAGS.list);
  updateTag(cacheTags.sitemap);
}

/** Bust a single city + the taxonomy lists. */
export function revalidateCity(id: string): void {
  updateTag(GEO_TAGS.city(id));
  revalidateGeography();
}
