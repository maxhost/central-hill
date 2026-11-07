import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
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

/** ADR0058: localized editorial snapshots, legacy identity retained. */
export const apartment_locale_content = pgTable("apartment_locale_content", {
  id: pkUuid(),
  apartment_id: uuid().notNull().references(() => apartment.id, { onDelete: "cascade" }),
  locale: text().$type<import("@core/db/columns").Locale>().notNull(),
  published: jsonb().$type<import("./editorial-types").ApartmentEnvelope>(),
  draft: jsonb().$type<import("./editorial-types").ApartmentEnvelope>(),
  revision: integer().notNull().default(0),
  published_at: timestamp({withTimezone:true}), draft_saved_at: timestamp({withTimezone:true}),
  updated_by: text(), ...timestamps,
}, t => [unique("apartment_locale_content_entity_locale_unique").on(t.apartment_id,t.locale),
  check("apartment_locale_content_locale_ck",sql`${t.locale} in ('en','es','pt','fr')`),
  check("apartment_locale_content_revision_ck",sql`${t.revision} >= 0`)]);

/** ADR0061: live common data, independent of localized draft/publication. */
export const apartment_shared_content = pgTable("apartment_shared_content", {
  id: pkUuid(),
  apartment_id: uuid().notNull().references(() => apartment.id, { onDelete: "cascade" }),
  data: jsonb().$type<{ schemaVersion: 1; content: import("./editorial-types").ApartmentSharedContent }>().notNull(),
  revision: integer().notNull().default(0),
  updated_by: text(), ...timestamps,
}, t => [unique("apartment_shared_content_entity_unique").on(t.apartment_id),
  check("apartment_shared_content_revision_ck",sql`${t.revision} >= 0`)]);
