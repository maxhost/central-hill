import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `pages` — the 5 editable fixed marketing pages (ADR 0012). `data` holds the
 * SOURCE-locale values, validated against the page's fixed Zod schema (see
 * `validation.ts`). Target locales live in `translation` with field='block:<dot.path>'.
 */
export const page_content = pgTable("page_content", {
  id: pkUuid(),
  key: text()
    .$type<"home" | "owners" | "real_estate" | "about" | "guest">()
    .notNull()
    .unique(),
  status: text().$type<"draft" | "published">().notNull().default("draft"),
  data: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  og_image_media_id: uuid(), // → media_asset.id (core/media)
  ...timestamps,
});
