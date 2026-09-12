import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Media (owned by `core/media`). Content tables reference `media_asset.id`, never raw
 * URLs. `alt` is **[T]** → `translation` (entity_type='media_asset').
 *
 * **Two backends (ADR 0026).** `storage` says where the bytes live: `'r2'` for images
 * (and legacy video), `'stream'` for video on Cloudflare Stream, which stores no object
 * of ours at all — only a `stream_uid`. That is why `r2_key` is nullable and why the
 * CHECK below exists: exactly one locator must be present for the declared backend, so
 * a row can never be persisted pointing at nothing. Existing rows are all `'r2'`, which
 * the column default preserves.
 *
 * `poster_media_id` points at another `media_asset` (a video's poster frame) and is a
 * bare uuid with no FK — matching all 18 `*_media_id` references across the slices,
 * which are deliberately unconstrained because slices may not depend on kernel table
 * DDL. Referential safety for every one of them is enforced in one place, by the
 * reference-safe delete in the media library (runbook D4), not by scattered FKs.
 */
export const media_asset = pgTable(
  "media_asset",
  {
    id: pkUuid(),
    /** `'r2'` | `'stream'` — which backend holds the bytes. */
    storage: text().notNull().default("r2"),
    /** Object key in R2. Null only when `storage = 'stream'`. */
    r2_key: text(),
    /** Cloudflare Stream asset uid. Null unless `storage = 'stream'`. */
    stream_uid: text(),
    mime: text().notNull(),
    width: integer(),
    height: integer(),
    /** Size of the stored master in bytes (post-normalisation — ADR 0025). */
    bytes: integer(),
    /** Video duration; null for images. */
    duration_seconds: integer(),
    /** → `media_asset.id` of this video's poster frame. */
    poster_media_id: uuid(),
    blurhash: text(),
    credit: text(),
    ...timestamps,
  },
  (t) => [
    check(
      "media_asset_storage_ck",
      sql`(${t.storage} = 'r2' AND ${t.r2_key} IS NOT NULL) OR (${t.storage} = 'stream' AND ${t.stream_uid} IS NOT NULL)`,
    ),
  ],
);
