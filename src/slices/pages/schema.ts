import { integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `pages` — the 5 editable fixed marketing pages + the `blog`/`guides` copy + the `buildings` listing (ADR 0012).
 * `data` holds the SOURCE-locale values, validated against the page's fixed Zod schema (see
 * `validation.ts`). Target locales live in `translation` with field='block:<dot.path>'.
 *
 * Pages have **no draft/published state** (owner direction): a row that exists is live.
 * (The former `status` column was dropped — see drizzle/0003.)
 */
export const page_content = pgTable("page_content", {
  id: pkUuid(),
  key: text()
    .$type<"home" | "owners" | "real_estate" | "about" | "guest" | "blog" | "guides" | "buildings" | "services">()
    .notNull()
    .unique(),
  data: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  og_image_media_id: uuid(), // → media_asset.id (core/media)
  ...timestamps,
});

/** Per-language editorial snapshots for adapted pages (ADR0040). */
export const page_locale_content = pgTable("page_locale_content", {
  id: pkUuid(),
  page_key: text().notNull(),
  locale: text().$type<import("@core/db/columns").Locale>().notNull(),
  published: jsonb().$type<import("./editorial-types").PageEnvelope>(),
  draft: jsonb().$type<import("./editorial-types").PageEnvelope>(),
  revision: integer().notNull().default(0),
  published_at: timestamp({ withTimezone: true }),
  draft_saved_at: timestamp({ withTimezone: true }),
  updated_by: text(),
  ...timestamps,
}, table => [unique("page_locale_content_page_locale_unique").on(table.page_key, table.locale)]);
