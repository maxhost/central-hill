import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * R2-backed media (owned by `core/media`). Content tables reference `media_asset.id`,
 * never raw URLs. Video heroes are referenced the same way; the player is chosen by
 * `mime` in the UI. `alt` is **[T]** → `translation` (entity_type='media_asset').
 */
export const media_asset = pgTable("media_asset", {
  id: pkUuid(),
  r2_key: text().notNull(),
  mime: text().notNull(),
  width: integer(),
  height: integer(),
  blurhash: text(),
  credit: text(),
  ...timestamps,
});
