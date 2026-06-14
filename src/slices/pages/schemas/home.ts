/**
 * `home` page content schema (ADR 0012). Source-locale values only.
 * Dynamic/shared content is NOT stored here — it is composed at render time:
 *   - stats band + dual-CTA contact → company_settings (settings slice)
 *   - featured portfolio → buildings (is_featured, top 3 by position)
 *   - testimonials (mixed audience) → testimonials slice
 * See docs/data-model.md → Page content model → home.
 */
import { z } from "zod";
import { cta, ctaWithNote, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { fixed, iconCard } from "./_shared";

export const homeSchema = z.object({
  hero: z.object({
    video_media_id: mediaId,
    headline: tStr({ max: 160 }),
    subtitle: tStrOpt({ max: 280 }),
    cta_primary: cta,
    cta_secondary: cta,
  }),
  owners_pitch: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 6),
    cta_primary: ctaWithNote,
    cta_secondary: ctaWithNote,
  }),
  guests_pitch: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 6),
    cta: ctaWithNote,
  }),
  story: z.object({
    headline: tStr({ max: 160 }),
    copy: tStr({ max: 1200 }),
    image_media_id: mediaId,
    cta: cta,
  }),
});

export type HomeContent = z.infer<typeof homeSchema>;
