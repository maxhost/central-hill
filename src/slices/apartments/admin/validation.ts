/**
 * Admin **save** schema for slice `apartments` (S12). Same shape conventions as the
 * buildings editor: nullable optionals (the client posts `null` for empty controls),
 * `min(1)` on required [T] text, gallery riding along. Avantio handles are required —
 * a unit's purpose is to be bookable (mirrors the public `apartmentInput`).
 */
import { z } from "zod";
import { contentStatus, position, slug, tStr } from "@core/validation/primitives";

const count = z.number().int().nonnegative();

export const apartmentSaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  status: contentStatus,
  position,
  building_id: z.uuid(),
  badge: tStr({ max: 60 }).nullable(),
  bedrooms: count,
  bathrooms: count,
  max_guests: z.number().int().positive(),
  beds_count: count,
  size_m2: z.number().int().positive().nullable(),
  floor: z.number().int().nullable(),
  cover_media_id: z.uuid(),
  og_image_media_id: z.uuid().nullable(),
  avantio_id: z.string().min(1).max(120),
  avantio_url: z.url(),
  // [T] source values (en):
  name: tStr({ min: 1, max: 160 }),
  description: tStr({ min: 1, max: 2000 }),
  meta_title: tStr({ max: 70 }).nullable(),
  meta_description: tStr({ max: 200 }).nullable(),
  gallery: z.array(z.uuid()),
});

export type ApartmentSaveInput = z.infer<typeof apartmentSaveInput>;
