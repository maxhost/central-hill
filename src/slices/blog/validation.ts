/**
 * Slice `blog` — input validation (category, author, post, related).
 * One category per post; no tags (data-model.md). Newsletter signup → leads slice.
 * See docs/data-model.md → Slice blog.
 */
import { z } from "zod";
import {
  contentStatus,
  mediaId,
  position,
  seoShape,
  slug,
  tStr,
  tStrOpt,
} from "@core/validation/primitives";
import { postBody } from "./body";

export const blogCategoryInput = z.object({
  slug,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex color").or(z.string().min(1).max(32)),
  position,
  // [T]
  name: tStr({ max: 80 }),
});
export type BlogCategoryInput = z.infer<typeof blogCategoryInput>;

export const authorInput = z.object({
  slug,
  status: contentStatus,
  avatar_media_id: mediaId.optional(),
  // [T]
  name: tStr({ max: 120 }),
  bio: tStrOpt({ max: 1000 }),
});
export type AuthorInput = z.infer<typeof authorInput>;

export const blogPostInput = z.object({
  slug,
  status: contentStatus,
  category_id: z.uuid(),
  author_id: z.uuid(),
  cover_media_id: mediaId,
  og_image_media_id: mediaId.optional(),
  published_at: z.iso.datetime().optional(),
  reading_minutes: z.number().int().positive().max(120),
  is_featured: z.boolean().default(false),
  cta_label: tStrOpt({ max: 80 }),
  cta_url: z.url().optional(),
  // [T]
  title: tStr({ max: 200 }),
  excerpt: tStr({ max: 400 }),
  body: postBody,
  ...seoShape,
});
export type BlogPostInput = z.infer<typeof blogPostInput>;

/** Exactly 3 curated related posts. */
export const blogPostRelatedInput = z.object({
  post_id: z.uuid(),
  related_post_id: z.uuid(),
  position,
});

export { postBody, bodyBlock } from "./body";
