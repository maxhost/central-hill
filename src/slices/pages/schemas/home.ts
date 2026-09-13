/**
 * `home` page content schema (ADR 0012). Source-locale values only.
 *
 * Home was reduced to hero · booking search · stats · guests pitch (ADR 0031), so this
 * schema holds only what that composition renders. The owners pitch and the owner/guest
 * dual-CTA panels were removed along with their sections; the featured portfolio and
 * testimonials were never stored here — they are composed from their own slices, and are
 * simply no longer composed into Home.
 *
 * The one remaining piece of composed content is the stats band → company_settings
 * (settings slice). See docs/data-model.md → Page content model → home.
 */
import { z } from "zod";
import { cta, ctaWithNote, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { faqGroupKey, fixed, iconCard, optionalImage } from "./_shared";

/** Uploader guidance surfaced in the admin media pickers (form-model reads `.describe`). */
const GUESTS_IMG_HINT =
  "Lifestyle photo for the Guests section. Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";

export const homeSchema = z.object({
  hero: z.object({
    video_media_id: mediaId,
    headline: tStr({ max: 160 }),
    subtitle: tStrOpt({ max: 280 }),
    cta_primary: cta,
    cta_secondary: cta,
  }),
  guests_pitch: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    image_media_id: optionalImage(GUESTS_IMG_HINT),
    cta: ctaWithNote,
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type HomeContent = z.infer<typeof homeSchema>;
