import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadContent } from "@core/i18n/content";
import { TESTIMONIAL, type TestimonialAudience } from "../contract";
import { testimonial } from "../schema";

/**
 * Backoffice reads for slice `testimonials` (S12). Unlike the public read these are
 * NOT cache-wrapped and return **all** statuses + **source-locale** ([T] en) values
 * for editing. Live data — admin routes are dynamic (auth), no ISR.
 */

const SOURCE = "en" as const;

type Status = "draft" | "published" | "archived";

export interface TestimonialAdminListItem {
  id: string;
  authorName: string;
  authorCountry: string;
  audience: TestimonialAudience;
  rating: number;
  status: Status;
  position: number;
  quote: string;
}

/** All testimonials for the list (every status), in display order. */
export async function listTestimonialsAdmin(): Promise<TestimonialAdminListItem[]> {
  const rows = await db.select().from(testimonial).orderBy(asc(testimonial.position));
  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((r) => ({ type: TESTIMONIAL, id: r.id })),
    SOURCE,
  );
  return rows.map((r) => ({
    id: r.id,
    authorName: r.author_name,
    authorCountry: r.author_country,
    audience: r.audience,
    rating: r.rating,
    status: r.status,
    position: r.position,
    quote: content.get(TESTIMONIAL, r.id, "quote") ?? "",
  }));
}

export interface TestimonialEditData {
  id: string;
  audience: TestimonialAudience;
  rating: number;
  author_name: string;
  author_country: string;
  property_location: string | null;
  position: number;
  status: Status;
  quote: string;
}

/** Full editable record for one testimonial (source-locale quote), or null. */
export async function getTestimonialForEdit(id: string): Promise<TestimonialEditData | null> {
  const [row] = await db.select().from(testimonial).where(eq(testimonial.id, id)).limit(1);
  if (!row) return null;
  const content = await loadContent([{ type: TESTIMONIAL, id }], SOURCE);
  return {
    id: row.id,
    audience: row.audience,
    rating: row.rating,
    author_name: row.author_name,
    author_country: row.author_country,
    property_location: row.property_location,
    position: row.position,
    status: row.status,
    quote: content.get(TESTIMONIAL, id, "quote") ?? "",
  };
}
