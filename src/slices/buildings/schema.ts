import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  jsonb,
  timestamp,
  unique,
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
  // When on (and an avantio_url is set) the listing card links out to that external
  // booking URL instead of the internal detail page.
  booking_enabled: boolean().notNull().default(false),
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

/** ADR0058: localized editorial snapshots, legacy identity retained. */
export const building_locale_content = pgTable("building_locale_content", {
  id: pkUuid(),
  building_id: uuid().notNull().references(() => building.id, { onDelete: "cascade" }),
  locale: text().$type<import("@core/db/columns").Locale>().notNull(),
  published: jsonb().$type<import("./editorial-types").BuildingEnvelope>(),
  draft: jsonb().$type<import("./editorial-types").BuildingEnvelope>(),
  revision: integer().notNull().default(0),
  published_at: timestamp({withTimezone:true}), draft_saved_at: timestamp({withTimezone:true}),
  updated_by: text(), ...timestamps,
}, t => [unique("building_locale_content_entity_locale_unique").on(t.building_id,t.locale),
  check("building_locale_content_locale_ck",sql`${t.locale} in ('en','es','pt','fr')`),
  check("building_locale_content_revision_ck",sql`${t.revision} >= 0`)]);

/** ADR0061: live common data, independent of localized draft/publication. */
export const building_shared_content = pgTable("building_shared_content", {
  id: pkUuid(),
  building_id: uuid().notNull().references(() => building.id, { onDelete: "cascade" }),
  data: jsonb().$type<{ schemaVersion: 1; content: import("./editorial-types").BuildingSharedContent }>().notNull(),
  revision: integer().notNull().default(0),
  updated_by: text(), ...timestamps,
}, t => [unique("building_shared_content_entity_unique").on(t.building_id),
  check("building_shared_content_revision_ck",sql`${t.revision} >= 0`)]);
