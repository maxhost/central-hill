import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";
import type { ServicePresentation } from "./presentation";

/**
 * Slice `services` — guest services (index + detail). [T] fields (name, excerpt,
 * body, meta_*) live in `translation`. `price_from` is integer cents (no variants).
 */
export const service_category = pgTable("service_category", {
  id: pkUuid(),
  slug: text().notNull(),
  icon: text(),
  position: integer().notNull().default(0),
  ...timestamps,
});

export const service = pgTable("service", {
  id: pkUuid(),
  slug: text().notNull(),
  status: text()
    .$type<"draft" | "published" | "archived">()
    .notNull()
    .default("draft"),
  position: integer().notNull().default(0),
  category_id: uuid()
    .notNull()
    .references(() => service_category.id),
  cover_media_id: uuid(), // → media_asset.id (core/media)
  og_image_media_id: uuid(), // → media_asset.id (core/media)
  price_from: integer(), // cents
  presentation: jsonb().$type<ServicePresentation>(),
  /**
   * Partner/service satisfaction score in **tenths** (0–50 → 0.0–5.0), or null when the
   * service has not been rated yet. Integer, never a float (data-model.md → Conventions);
   * the public read divides by 10. Surfaced as the star chip on the home services
   * carousel (ADR 0032).
   */
  rating_tenths: integer(),
  duration_label: text(),
  booking_type: text()
    .$type<"enquiry" | "external" | "none">()
    .notNull()
    .default("none"),
  cta_label: text(),
  cta_url: text(),
  ...timestamps,
});

export const service_media = pgTable("service_media", {
  id: pkUuid(),
  service_id: uuid()
    .notNull()
    .references(() => service.id, { onDelete: "cascade" }),
  media_id: uuid().notNull(), // → media_asset.id (core/media)
  position: integer().notNull().default(0),
  ...timestamps,
});

// ADR0065: lazy locale snapshots and live common data. No eager legacy backfill.
export const service_locale_content = pgTable("service_locale_content", {
  id: pkUuid(), service_id: uuid().notNull().references(() => service.id, { onDelete: "cascade" }),
  locale: text().$type<import("@core/db/columns").Locale>().notNull(),
  published: jsonb().$type<import("./editorial-types").ServiceEnvelope>(),
  draft: jsonb().$type<import("./editorial-types").ServiceEnvelope>(),
  revision: integer().notNull().default(0),
  published_at: timestamp({ withTimezone: true }), draft_saved_at: timestamp({ withTimezone: true }),
  updated_by: text(), ...timestamps,
}, table => [
  unique("service_locale_content_entity_locale_unique").on(table.service_id, table.locale),
  check("service_locale_content_locale_ck", sql`${table.locale} in ('en','es','pt','fr')`),
  check("service_locale_content_revision_ck", sql`${table.revision} >= 0`),
]);
export const service_shared_content = pgTable("service_shared_content", {
  id: pkUuid(), service_id: uuid().notNull().references(() => service.id, { onDelete: "cascade" }),
  data: jsonb().$type<{ schemaVersion: 1; content: import("./editorial-types").ServiceSharedContent }>().notNull(),
  revision: integer().notNull().default(0), updated_by: text(), ...timestamps,
}, table => [
  unique("service_shared_content_entity_unique").on(table.service_id),
  check("service_shared_content_revision_ck", sql`${table.revision} >= 0`),
]);
