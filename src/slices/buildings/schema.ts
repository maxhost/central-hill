import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `buildings` — core catalog entity. Amenities & FAQ are **building-level**.
 * [T] fields (name, headline, teaser, description_*, meta_*) live in `translation`.
 */
export const building = pgTable("building", {
  id: pkUuid(),
  slug: text().notNull(),
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  position: integer().notNull().default(0),
  is_new: boolean().notNull().default(false),
  is_featured: boolean().notNull().default(false),
  city_id: uuid().notNull(), // → city.id (geography)
  neighbourhood_id: uuid(), // → neighbourhood.id (geography)
  street_address: text(),
  latitude: doublePrecision(),
  longitude: doublePrecision(),
  cover_media_id: uuid(), // → media_asset.id (core/media)
  og_image_media_id: uuid(), // → media_asset.id (core/media)
  avantio_id: text(),
  avantio_url: text(),
  // Denormalized stats — recomputed by this slice on apartment publish.
  apartments_count: integer().notNull().default(0),
  total_capacity: integer().notNull().default(0),
  beds_count: integer().notNull().default(0),
  ...timestamps,
});

export const building_media = pgTable("building_media", {
  id: pkUuid(),
  building_id: uuid()
    .notNull()
    .references(() => building.id, { onDelete: "cascade" }),
  media_id: uuid().notNull(), // → media_asset.id (core/media)
  position: integer().notNull().default(0),
  ...timestamps,
});

/** Amenity taxonomy ([T] label in `translation`). */
export const amenity = pgTable("amenity", {
  id: pkUuid(),
  slug: text().notNull(),
  icon: text(),
  group: text(),
  ...timestamps,
});

export const building_amenity = pgTable(
  "building_amenity",
  {
    building_id: uuid()
      .notNull()
      .references(() => building.id, { onDelete: "cascade" }),
    amenity_id: uuid()
      .notNull()
      .references(() => amenity.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.building_id, t.amenity_id] })],
);

/** Per-building FAQ ([T] question, answer in `translation`). */
export const building_faq = pgTable("building_faq", {
  id: pkUuid(),
  building_id: uuid()
    .notNull()
    .references(() => building.id, { onDelete: "cascade" }),
  position: integer().notNull().default(0),
  ...timestamps,
});
