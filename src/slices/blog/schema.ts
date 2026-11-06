import { sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `blog`. One category per post, no tags. Body is portable JSON stored as a
 * [T] field in `translation` (entity_type='blog_post', field='body'), not a column.
 */
export const blog_category = pgTable("blog_category", {
  id: pkUuid(),
  slug: text().notNull(),
  color: text(),
  position: integer().notNull().default(0),
  ...timestamps,
});

export const author = pgTable("author", {
  id: pkUuid(),
  slug: text().notNull(),
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  avatar_media_id: uuid(), // → media_asset.id (core/media)
  ...timestamps,
});

export const blog_post = pgTable("blog_post", {
  id: pkUuid(),
  slug: text().notNull(),
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  category_id: uuid()
    .notNull()
    .references(() => blog_category.id),
  author_id: uuid()
    .notNull()
    .references(() => author.id),
  cover_media_id: uuid(), // → media_asset.id (core/media)
  og_image_media_id: uuid(), // → media_asset.id (core/media)
  published_at: timestamp("published_at", { withTimezone: true }),
  reading_minutes: integer(),
  is_featured: boolean().notNull().default(false),
  cta_label: text(),
  cta_url: text(),
  ...timestamps,
});

/** Exactly 3 curated related posts per post. */
export const blog_post_related = pgTable(
  "blog_post_related",
  {
    post_id: uuid()
      .notNull()
      .references(() => blog_post.id, { onDelete: "cascade" }),
    related_post_id: uuid()
      .notNull()
      .references(() => blog_post.id, { onDelete: "cascade" }),
    position: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.post_id, t.related_post_id] })],
);

/** ADR0057: independent editorial snapshots; legacy content stays available for bootstrap. */
export const blog_post_locale_content = pgTable("blog_post_locale_content", {
  id: pkUuid(),
  post_id: uuid().notNull().references(() => blog_post.id, { onDelete: "cascade" }),
  locale: text().$type<import("@core/db/columns").Locale>().notNull(),
  published: jsonb().$type<import("./editorial-types").BlogPostEnvelopeV1>(),
  draft: jsonb().$type<import("./editorial-types").BlogPostEnvelopeV1>(),
  revision: integer().notNull().default(0),
  published_at: timestamp({ withTimezone: true }),
  draft_saved_at: timestamp({ withTimezone: true }),
  updated_by: text(),
  ...timestamps,
}, table => [unique("blog_post_locale_content_post_locale_unique").on(table.post_id, table.locale),
  check("blog_post_locale_content_locale_ck", sql`${table.locale} in ('en','es','pt','fr')`),
  check("blog_post_locale_content_revision_ck", sql`${table.revision} >= 0`)]);
