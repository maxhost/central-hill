import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { loadContent } from "@core/i18n/content";
import { TESTIMONIAL, TESTIMONIAL_TAGS, type Testimonial, type TestimonialAudience } from "../contract";
import { testimonial } from "../schema";
import { unstable_cache } from "next/cache";

/**
 * Public read functions for slice `testimonials` (conventions.md → reads go through
 * typed, cache-tagged `server/` functions; never the DB at request time). Wrapped in
 * `unstable_cache` keyed by locale + audience and tagged `testimonial-list` so a
 * publish busts them (see `./publish`). The `quote` [T] field resolves via `core/i18n`.
 */
async function _listTestimonials(
  locale: Locale,
  audience?: TestimonialAudience,
): Promise<Testimonial[]> {
  const where = audience
    ? and(eq(testimonial.status, "published"), eq(testimonial.audience, audience))
    : eq(testimonial.status, "published");

  const rows = await db
    .select({
      id: testimonial.id,
      audience: testimonial.audience,
      rating: testimonial.rating,
      author_name: testimonial.author_name,
      author_country: testimonial.author_country,
      property_location: testimonial.property_location,
    })
    .from(testimonial)
    .where(where)
    .orderBy(asc(testimonial.position));

  if (rows.length === 0) return [];

  const content = await loadContent(
    rows.map((r) => ({ type: TESTIMONIAL, id: r.id })),
    locale,
  );

  return rows.map((r) => ({
    id: r.id,
    audience: r.audience,
    rating: r.rating,
    quote: content.get(TESTIMONIAL, r.id, "quote") ?? "",
    authorName: r.author_name,
    authorCountry: r.author_country,
    propertyLocation: r.property_location,
  }));
}

/**
 * Published testimonials in display order, optionally filtered by audience
 * (`owner` | `guest`). Returns `[]` when none are published.
 */
export function listTestimonials(
  locale: Locale,
  audience?: TestimonialAudience,
): Promise<Testimonial[]> {
  return unstable_cache(
    () => _listTestimonials(locale, audience),
    ["testimonials:listTestimonials", locale, audience ?? "all"],
    { tags: [TESTIMONIAL_TAGS.list] },
  )();
}
