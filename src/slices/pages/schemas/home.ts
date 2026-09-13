/**
 * `home` page content schema (ADR 0012). Source-locale values only.
 *
 * Home was reduced to hero · booking search · stats · guests pitch (ADR 0031), so this
 * schema holds only what that composition renders. The owners pitch and the owner/guest
 * dual-CTA panels were removed along with their sections; the featured portfolio and
 * testimonials were never stored here — they are composed from their own slices, and are
 * simply no longer composed into Home.
 *
 * Composed (not authored) content: the stats band → company_settings (settings slice),
 * and the services carousel → the `services` slice catalogue (ADR 0032) — the page only
 * stores that section's own copy. See docs/data-model.md → Page content model → home.
 */
import { z } from "zod";
import { cta, ctaWithNote, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import {
  assurance,
  faqGroupKey,
  fixed,
  iconCard,
  optionalImage,
  serviceCategorySlug,
} from "./_shared";

/** Uploader guidance surfaced in the admin media pickers (form-model reads `.describe`). */
const GUESTS_IMG_HINT =
  "Lifestyle photo for the Guests section. Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";

/** Exactly three reassurance marks — the strip under the carousel heading. */
const ASSURANCE_COUNT = 3;

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
  /**
   * Services & partners carousel (ADR 0032). The **cards** are not authored here — they
   * are the published services of slice `services`, in their admin-set `position` order,
   * optionally narrowed to one category. Only the section's own copy lives in the page:
   * the heading, the three reassurance marks, and which category to show. The section
   * renders nothing when no published service matches.
   */
  services_carousel: z.object({
    eyebrow: tStrOpt({ max: 60 }),
    headline: tStr({ max: 160 }),
    assurances: fixed(assurance, ASSURANCE_COUNT),
    service_category_slug: serviceCategorySlug,
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type HomeContent = z.infer<typeof homeSchema>;

/**
 * Canonical copy for the services carousel — used by the demo seed and by
 * `scripts/backfill-home-services-carousel.ts` to fill the section on a `home` row that
 * predates it. Staff can rewrite every word of it in the Home editor; only the three
 * `icon_key`s are code-side (they must exist in the `pages` icon set).
 */
export const defaultServicesCarousel: HomeContent["services_carousel"] = {
  eyebrow: "Partners & Services",
  headline: "Central Hill Partners and Services",
  assurances: [
    { icon_key: "check-circle", label: "Exclusive Selection" },
    { icon_key: "shield-check", label: "Safety Guaranteed" },
    { icon_key: "headset", label: "24h Customer Support" },
  ],
  service_category_slug: "",
};
