/**
 * Slice `buildings` — input validation (building + media + amenities + faq + amenity taxonomy).
 * Amenities & FAQ are BUILDING-level (data-model.md reconciliation). Denormalized
 * stats (apartments_count, total_capacity, beds_count) are recomputed by the slice on
 * apartment publish — never client input, so they are absent here.
 * See docs/data-model.md → Slice buildings.
 */
import { z } from "zod";
import {
  contentStatus,
  latitude,
  longitude,
  mediaId,
  position,
  seoShape,
  slug,
  tStr,
  tStrOpt,
} from "@core/validation/primitives";

export const buildingInput = z.object({
  slug,
  status: contentStatus,
  position,
  is_new: z.boolean().default(false), // "New" badge
  is_featured: z.boolean().default(false),
  city_id: z.uuid(),
  neighbourhood_id: z.uuid().optional(),
  street_address: z.string().min(1).max(240),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  cover_media_id: mediaId,
  og_image_media_id: mediaId.optional(),
  avantio_id: z.string().max(120).optional(),
  avantio_url: z.url().optional(),
  // [T]
  name: tStr({ max: 160 }),
  headline: tStr({ max: 160 }),
  teaser: tStr({ max: 200 }),
  description_intro: tStr({ max: 2000 }),
  description_neighbourhood: tStrOpt({ max: 2000 }),
  ...seoShape,
});
export type BuildingInput = z.infer<typeof buildingInput>;

/** Gallery row. */
export const buildingMediaInput = z.object({
  building_id: z.uuid(),
  media_id: mediaId,
  position,
});

/** M:N building ↔ amenity. */
export const buildingAmenityInput = z.object({
  building_id: z.uuid(),
  amenity_id: z.uuid(),
});

export const buildingFaqInput = z.object({
  building_id: z.uuid(),
  position,
  // [T]
  question: tStr({ max: 300 }),
  answer: tStr({ max: 2000 }),
});
export type BuildingFaqInput = z.infer<typeof buildingFaqInput>;

/** Amenity taxonomy (seeded set). */
export const amenityInput = z.object({
  slug,
  icon: z.string().min(1).max(64),
  group: z.string().max(64).optional(),
  // [T]
  label: tStr({ max: 80 }),
});
export type AmenityInput = z.infer<typeof amenityInput>;
