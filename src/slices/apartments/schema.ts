import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `apartments` — bookable unit (links to Avantio). Amenities & FAQ live on
 * the building. [T] fields (name, description, meta_*) live in `translation`.
 */
export const apartment = pgTable("apartment", {
  id: pkUuid(),
  slug: text().notNull(),
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  position: integer().notNull().default(0),
  building_id: uuid().notNull(), // → building.id (buildings)
  badge: text(),
  bedrooms: integer().notNull().default(0),
  bathrooms: integer().notNull().default(0),
  max_guests: integer().notNull().default(0),
  beds_count: integer().notNull().default(0),
  size_m2: integer(),
  floor: integer(),
  cover_media_id: uuid(), // → media_asset.id (core/media)
  og_image_media_id: uuid(), // → media_asset.id (core/media)
  avantio_id: text(),
  avantio_url: text(),
  ...timestamps,
});

export const apartment_media = pgTable("apartment_media", {
  id: pkUuid(),
  apartment_id: uuid()
    .notNull()
    .references(() => apartment.id, { onDelete: "cascade" }),
  media_id: uuid().notNull(), // → media_asset.id (core/media)
  position: integer().notNull().default(0),
  ...timestamps,
});
