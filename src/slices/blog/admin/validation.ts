/**
 * Admin **save** schemas for slice `blog` (S12) — category, author and post editors.
 * Mirrors the public `blog/validation` in the editor's post shape: `id?`, nullable
 * optionals (the client posts `null` for empty controls), `min(1)` on required [T]
 * text. Category/author `slug` are plain columns; the post `slug` is in the slug
 * table. The post `body` is the portable-JSON block array (ADR 0013) — stored as a
 * single [T] field; `related_ids` are the (≤3) curated related posts.
 */
import { z } from "zod";
import { contentStatus, slug, position, tStr } from "@core/validation/primitives";
import { postBody } from "../body";

export const blogCategorySaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex color").or(z.string().min(1).max(32)),
  position,
  // [T] source value (en):
  name: tStr({ min: 1, max: 80 }),
});
export type BlogCategorySaveInput = z.infer<typeof blogCategorySaveInput>;

export const authorSaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  status: contentStatus,
  avatar_media_id: z.uuid().nullable(),
  // [T] source values (en):
  name: tStr({ min: 1, max: 120 }),
  bio: tStr({ max: 1000 }).nullable(),
});
export type AuthorSaveInput = z.infer<typeof authorSaveInput>;

export const blogPostSaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  status: contentStatus,
  category_id: z.uuid(),
  author_id: z.uuid(),
  cover_media_id: z.uuid(),
  og_image_media_id: z.uuid().nullable(),
  published_at: z
    .string()
    .nullable()
    .refine((v) => v === null || v.trim() === "" || !Number.isNaN(Date.parse(v)), "invalid date"),
  reading_minutes: z.number().int().positive().max(120),
  is_featured: z.boolean(),
  cta_label: tStr({ max: 80 }).nullable(),
  cta_url: z.url().nullable(),
  // [T] source values (en):
  title: tStr({ min: 1, max: 200 }),
  excerpt: tStr({ min: 1, max: 400 }),
  body: postBody,
  meta_title: tStr({ max: 70 }).nullable(),
  meta_description: tStr({ max: 200 }).nullable(),
  // Relation (curated, ≤3):
  related_ids: z.array(z.uuid()).max(3),
});
export type BlogPostSaveInput = z.infer<typeof blogPostSaveInput>;
