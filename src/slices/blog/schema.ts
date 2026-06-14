import { boolean, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
