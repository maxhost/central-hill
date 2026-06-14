import { doublePrecision, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `guides` — "What to Do" city guides (page → section → place tree).
 * [T] fields (title/intro/body/local_tip/name/description/meta_*) live in `translation`.
 */
export const guide_page = pgTable("guide_page", {
  id: pkUuid(),
  city_id: uuid().notNull(), // → city.id (geography)
  template: text()
    .$type<
      "landing" | "eat" | "beaches" | "events" | "secrets" | "families" | "groups" | "travellers" | "custom"
    >()
    .notNull()
    .default("landing"),
  slug: text().notNull(),
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  position: integer().notNull().default(0),
  hero_media_id: uuid(), // → media_asset.id (core/media)
  og_image_media_id: uuid(), // → media_asset.id (core/media)
  ...timestamps,
});

export const guide_section = pgTable("guide_section", {
  id: pkUuid(),
  guide_page_id: uuid()
    .notNull()
    .references(() => guide_page.id, { onDelete: "cascade" }),
  position: integer().notNull().default(0),
  layout: text()
    .$type<"standard" | "with_cta" | "with_media" | "featured_places">()
    .notNull()
    .default("standard"),
  header_media_id: uuid(), // → media_asset.id (core/media)
  cta_label: text(),
  cta_url: text(),
  ...timestamps,
});

export const guide_place = pgTable("guide_place", {
  id: pkUuid(),
  guide_section_id: uuid()
    .notNull()
    .references(() => guide_section.id, { onDelete: "cascade" }),
  position: integer().notNull().default(0),
  category: text(),
  address: text(),
  phone: text(),
  price_tier: text().$type<"budget" | "mid" | "premium">(),
  opening_hours: text(),
  latitude: doublePrecision(),
  longitude: doublePrecision(),
  website_url: text(),
  booking_url: text(),
  media_id: uuid(), // → media_asset.id (core/media)
  ...timestamps,
});
