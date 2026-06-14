/**
 * Slice `guides` — input validation ("What to Do" city guides: page → section → place).
 * See docs/data-model.md → Slice guides.
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

export const guideTemplate = z.enum([
  "landing",
  "eat",
  "beaches",
  "events",
  "secrets",
  "families",
  "groups",
  "travellers",
  "custom",
]);

export const guideLayout = z.enum(["standard", "with_cta", "with_media", "featured_places"]);
export const priceTier = z.enum(["budget", "mid", "premium"]); // €/€€/€€€

export const guidePageInput = z.object({
  city_id: z.uuid(),
  template: guideTemplate,
  slug,
  status: contentStatus,
  position,
  hero_media_id: mediaId.optional(),
  og_image_media_id: mediaId.optional(),
  // [T]
  title: tStr({ max: 200 }),
  intro: tStrOpt({ max: 1200 }),
  ...seoShape,
});
export type GuidePageInput = z.infer<typeof guidePageInput>;

export const guideSectionInput = z.object({
  guide_page_id: z.uuid(),
  position,
  layout: guideLayout,
  header_media_id: mediaId.optional(),
  cta_label: tStrOpt({ max: 80 }),
  cta_url: z.url().optional(),
  // [T]
  title: tStr({ max: 200 }),
  body: tStrOpt({ max: 4000 }),
  local_tip: tStrOpt({ max: 600 }),
});
export type GuideSectionInput = z.infer<typeof guideSectionInput>;

export const guidePlaceInput = z.object({
  guide_section_id: z.uuid(),
  position,
  category: z.string().max(80).optional(),
  address: z.string().max(240).optional(),
  phone: z.string().max(40).optional(),
  price_tier: priceTier.optional(),
  opening_hours: z.string().max(400).optional(),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  website_url: z.url().optional(),
  booking_url: z.url().optional(),
  media_id: mediaId.optional(),
  // [T]
  name: tStr({ max: 160 }),
  description: tStrOpt({ max: 1200 }),
});
export type GuidePlaceInput = z.infer<typeof guidePlaceInput>;
