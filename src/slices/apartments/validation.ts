/**
 * Slice `apartments` — input validation (apartment + media). The bookable unit;
 * links to Avantio. Amenities & FAQ live on the BUILDING, not here (data-model.md).
 * See docs/data-model.md → Slice apartments.
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

const count = z.number().int().nonnegative();

export const apartmentInput = z.object({
  slug,
  status: contentStatus,
  position,
  building_id: z.uuid(),
  badge: tStrOpt({ max: 60 }), // e.g. "Penthouse"
  bedrooms: count,
  bathrooms: count,
  max_guests: z.number().int().positive(),
  beds_count: count,
  size_m2: z.number().int().positive().optional(),
  floor: z.number().int().optional(),
  cover_media_id: mediaId,
  og_image_media_id: mediaId.optional(),
  avantio_id: z.string().min(1).max(120),
  avantio_url: z.url(),
  // [T]
  name: tStr({ max: 160 }),
  description: tStr({ max: 2000 }),
  ...seoShape,
});
export type ApartmentInput = z.infer<typeof apartmentInput>;

export const apartmentMediaInput = z.object({
  apartment_id: z.uuid(),
  media_id: mediaId,
  position,
});
