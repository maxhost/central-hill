import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `testimonials` — audience-tagged, shared by Home/Owners/Guests.
 * [T] field `quote` lives in `translation`. Author name/country are not translated.
 */
export const testimonial = pgTable("testimonial", {
  id: pkUuid(),
  audience: text().$type<"owner" | "guest">().notNull(),
  rating: integer().notNull().default(5),
  author_name: text().notNull(),
  author_country: text().notNull(),
  property_location: text(),
  position: integer().notNull().default(0),
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  ...timestamps,
});
