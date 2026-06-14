/**
 * Slice `geography` — input validation for the catalog taxonomy (city, neighbourhood).
 * Validates admin-form input (source-locale fields); ids/timestamps are generated.
 * See docs/data-model.md → Slice geography.
 */
import { z } from "zod";
import { contentStatus, mediaId, position, slug, tStr, tStrOpt } from "@core/validation/primitives";

export const cityInput = z.object({
  slug,
  position,
  status: contentStatus,
  country: z.string().length(2).default("PT"),
  hero_media_id: mediaId.optional(),
  // [T]
  name: tStr({ max: 120 }),
  intro: tStrOpt({ max: 800 }),
});
export type CityInput = z.infer<typeof cityInput>;

export const neighbourhoodInput = z.object({
  city_id: z.uuid(),
  slug,
  position,
  // [T]
  name: tStr({ max: 120 }),
});
export type NeighbourhoodInput = z.infer<typeof neighbourhoodInput>;
