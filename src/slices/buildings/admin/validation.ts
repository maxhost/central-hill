/**
 * Admin **save** schema for slice `buildings` (S12). Mirrors the public
 * `buildingInput` field rules but in the shape the editor actually posts: optional
 * fields are `nullable` (the client sends `null` for an empty control rather than
 * omitting the key), required [T] text gets a `min(1)` so a building can't be saved
 * blank, and the relational sets (gallery / amenities / FAQ) ride along. The server
 * action validates with this, so all coercion lives in one place.
 */
import { z } from "zod";
import {
  contentStatus,
  latitude,
  longitude,
  position,
  slug,
  tStr,
} from "@core/validation/primitives";

/** A FAQ row as the editor posts it; `id` present ⇒ update, absent ⇒ insert. */
export const buildingFaqForm = z.object({
  id: z.uuid().optional(),
  question: tStr({ min: 1, max: 300 }),
  answer: tStr({ min: 1, max: 2000 }),
});

export const buildingSaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  status: contentStatus,
  position,
  is_new: z.boolean(),
  is_featured: z.boolean(),
  city_id: z.uuid(),
  neighbourhood_id: z.uuid().nullable(),
  street_address: z.string().min(1).max(240),
  latitude: latitude.nullable(),
  longitude: longitude.nullable(),
  cover_media_id: z.uuid(),
  og_image_media_id: z.uuid().nullable(),
  avantio_id: z.string().max(120).nullable(),
  avantio_url: z.url().nullable(),
  // [T] source values (en):
  name: tStr({ min: 1, max: 160 }),
  headline: tStr({ min: 1, max: 160 }),
  teaser: tStr({ min: 1, max: 200 }),
  description_intro: tStr({ min: 1, max: 2000 }),
  description_neighbourhood: tStr({ max: 2000 }).nullable(),
  meta_title: tStr({ max: 70 }).nullable(),
  meta_description: tStr({ max: 200 }).nullable(),
  // Relations:
  gallery: z.array(z.uuid()),
  amenity_ids: z.array(z.uuid()),
  faq: z.array(buildingFaqForm),
});

export type BuildingSaveInput = z.infer<typeof buildingSaveInput>;
