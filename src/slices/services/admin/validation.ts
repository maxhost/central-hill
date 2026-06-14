/**
 * Admin **save** schemas for slice `services` (S12) — the service-category and the
 * service editors. Mirrors the public `serviceInput`/`serviceCategoryInput` in the
 * editor's post shape: `id?`, nullable optionals (the client posts `null` for empty
 * controls), `min(1)` on required [T] text, gallery riding along. `price_from` is
 * integer cents (no floats). Category `slug` is a plain column (not the slug table).
 */
import { z } from "zod";
import { cents, contentStatus, position, slug, tStr } from "@core/validation/primitives";

export const serviceCategorySaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  icon: z.string().min(1).max(64),
  position,
  // [T] source value (en):
  name: tStr({ min: 1, max: 80 }),
});
export type ServiceCategorySaveInput = z.infer<typeof serviceCategorySaveInput>;

export const serviceSaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  status: contentStatus,
  position,
  category_id: z.uuid(),
  cover_media_id: z.uuid(),
  og_image_media_id: z.uuid().nullable(),
  price_from: cents.nullable(),
  booking_type: z.enum(["enquiry", "external", "none"]),
  cta_url: z.url().nullable(),
  // [T] source values (en):
  name: tStr({ min: 1, max: 160 }),
  excerpt: tStr({ min: 1, max: 400 }),
  body: tStr({ min: 1, max: 6000 }),
  duration_label: tStr({ max: 80 }).nullable(),
  cta_label: tStr({ max: 80 }).nullable(),
  meta_title: tStr({ max: 70 }).nullable(),
  meta_description: tStr({ max: 200 }).nullable(),
  // Relation:
  gallery: z.array(z.uuid()),
});
export type ServiceSaveInput = z.infer<typeof serviceSaveInput>;
