/**
 * `guest` (guests landing) page content schema (ADR 0012). Source-locale only.
 * Composed at render time: featured portfolio → buildings; testimonials
 * (audience='guest') → testimonials slice; dual-CTA → company_settings.
 * See docs/data-model.md → Page content model → guest.
 */
import { z } from "zod";
import { cta, ctaWithNote, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { faqGroupKey, fixed, iconCard } from "./_shared";

export const guestSchema = z.object({
  hero: z.object({
    video_media_id: mediaId,
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    cta: cta,
  }),
  welcome: z.object({
    headline: tStr({ max: 160 }),
    lede: tStr({ max: 400 }),
    copy: tStr({ max: 1200 }),
    guarantee_label: tStrOpt({ max: 120 }),
    image_media_id: mediaId,
  }),
  why: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    benefits: fixed(iconCard, 4),
    cta: ctaWithNote,
  }),
  services_teaser: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(iconCard, 6),
    cta: ctaWithNote,
  }),
  activities_teaser: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(iconCard, 6),
    cta: cta,
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type GuestContent = z.infer<typeof guestSchema>;
