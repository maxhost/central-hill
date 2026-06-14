import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `geography` — taxonomy used across the catalog.
 * [T] fields (name, intro) live in `translation`, not as columns here.
 */
export const city = pgTable("city", {
  id: pkUuid(),
  slug: text().notNull(),
  position: integer().notNull().default(0),
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  country: text().notNull().default("PT"),
  hero_media_id: uuid(), // → media_asset.id (core/media)
  ...timestamps,
});

export const neighbourhood = pgTable("neighbourhood", {
  id: pkUuid(),
  city_id: uuid()
    .notNull()
    .references(() => city.id, { onDelete: "cascade" }),
  slug: text().notNull(),
  position: integer().notNull().default(0),
  ...timestamps,
});
