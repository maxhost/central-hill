import { integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `settings` / `globals` — site-wide singleton + navigation.
 * Like `page_content`, source values are stored inline (scalars/jsonb); [T] bits
 * (stat labels, office_hours_label, nav label) are translated via `translation`.
 */
export const company_settings = pgTable("company_settings", {
  id: pkUuid(),
  email: text().notNull(),
  phone: text().notNull(),
  whatsapp: text(),
  social: jsonb().$type<Record<string, string>>().notNull().default({}),
  /** { bookings|years|guests|revenue|buildings|apartments: { value, label } } */
  stats: jsonb().$type<Record<string, { value: string; label: string }>>().notNull().default({}),
  office_address: text().notNull(),
  office_hours: text(),
  office_hours_label: text(),
  currency: text().notNull().default("EUR"),
  default_og_image_media_id: uuid(), // → media_asset.id (core/media)
  avantio_account_id: text().notNull(),
  avantio_widget_config: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});

export const nav_item = pgTable("nav_item", {
  id: pkUuid(),
  location: text().$type<"header" | "footer">().notNull(),
  parent_id: uuid(), // self-reference → nav_item.id
  position: integer().notNull().default(0),
  url: text().notNull(),
  ...timestamps,
});
