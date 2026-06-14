/**
 * Slice `services` — input validation (service, service_category, media).
 * No price *variants* — a single `price_from` (data-model.md). `booking_type`
 * routes the CTA: external → cta_url; enquiry → guest contact path; none → display only.
 * See docs/data-model.md → Slice services.
 */
import { z } from "zod";
import {
  cents,
  contentStatus,
  mediaId,
  position,
  seoShape,
  slug,
  tStr,
  tStrOpt,
} from "@core/validation/primitives";

export const serviceCategoryInput = z.object({
  slug,
  icon: z.string().min(1).max(64),
  position,
  // [T]
  name: tStr({ max: 80 }),
});
export type ServiceCategoryInput = z.infer<typeof serviceCategoryInput>;

export const serviceInput = z.object({
  slug,
  status: contentStatus,
  position,
  category_id: z.uuid(),
  cover_media_id: mediaId,
  og_image_media_id: mediaId.optional(),
  price_from: cents.optional(),
  duration_label: tStrOpt({ max: 80 }),
  booking_type: z.enum(["enquiry", "external", "none"]),
  cta_label: tStrOpt({ max: 80 }),
  cta_url: z.url().optional(),
  // [T]
  name: tStr({ max: 160 }),
  excerpt: tStr({ max: 400 }),
  body: tStr({ max: 6000 }), // rich text (markdown/portable)
  ...seoShape,
});
export type ServiceInput = z.infer<typeof serviceInput>;

export const serviceMediaInput = z.object({
  service_id: z.uuid(),
  media_id: mediaId,
  position,
});
