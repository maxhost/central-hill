/**
 * `home` page content schema (ADR 0012). Source-locale values only.
 *
 * Home was reduced to a guest-facing funnel by ADR 0031 (owners pitch + dual-CTA removed);
 * client direction has since restored the featured portfolio and the closing owner/guest
 * dual-CTA band (the owners pitch and testimonials stay out for now). The featured portfolio
 * is still composed straight from the `buildings` slice, not stored here.
 *
 * Composed (not authored) content: the stats band + dual-CTA contact line →
 * company_settings (settings slice), and the services carousel → the `services` slice
 * catalogue (ADR 0032) — the page only stores that section's own copy. See
 * docs/data-model.md → Page content model → home.
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
const PANEL_IMG_HINT =
  "Panel background photo. Landscape — recommended 1600×1200px, JPG or WebP, under 600 KB.";

/** Exactly three reassurance marks — the strip under the carousel heading. */
const ASSURANCE_COUNT = 3;

/** One side of the closing owner/guest dual-CTA band (editable copy + background). */
const ctaPanel = z.object({
  image_media_id: optionalImage(PANEL_IMG_HINT),
  eyebrow: tStr({ max: 60 }),
  title: tStr({ max: 160 }),
  body: tStr({ max: 400 }),
  cta_label: tStr({ max: 60 }),
});

export const homeSchema = z.object({
  hero: z.object({
    video_media_id: mediaId,
    headline: tStr({ max: 160 }),
    subtitle: tStrOpt({ max: 280 }),
    // External booking engine (Avantio) — genuinely a redirect, so its target is
    // CMS-editable like any other cta.
    cta_primary: cta,
    // Always our own internal Owners route — never a CMS-editable target (client
    // feedback: a free-text `url` shared by all 4 locales can only ever be correct for
    // one of them). Staff can only edit the button's copy; `home-page.tsx` hardcodes the
    // locale-aware `/owners` href.
    cta_secondary: z.object({ label: tStr({ max: 80 }) }),
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
  // Closing band: two image panels (owner / guest) with editable copy + CTA labels.
  dual_cta: z.object({
    owner: ctaPanel,
    guest: ctaPanel,
  }),
});

export type HomeContent = z.infer<typeof homeSchema>;

/**
 * Canonical copy for the services carousel — used by the demo seed and by
 * `scripts/backfill-home-services-carousel.ts` to fill the section on a `home` row that
 * predates it. Staff can rewrite every word of it in the Home editor and pick each
 * `icon_key` with the icon picker (any Iconoir name, ADR 0034).
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
