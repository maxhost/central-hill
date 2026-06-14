import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

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
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  position: integer().notNull().default(0),
  category_id: uuid()
    .notNull()
    .references(() => service_category.id),
  cover_media_id: uuid(), // → media_asset.id (core/media)
  og_image_media_id: uuid(), // → media_asset.id (core/media)
  price_from: integer(), // cents
  duration_label: text(),
  booking_type: text().$type<"enquiry" | "external" | "none">().notNull().default("none"),
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
