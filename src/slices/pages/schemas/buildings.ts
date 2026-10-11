/**
 * `buildings` page content schema — the Buildings **listing** (`/<locale>/buildings`), spec
 * `buildings-admin-editor`. Source-locale values only. Not the detail page `/buildings/[slug]`.
 *
 * Composed at render time (NOT in `data`): the building cards → slice `buildings`
 * (`/admin/buildings`); the estimate form's field labels/placeholders → `pages.estimateForm.*`;
 * a blank owner-panel contact line → company_settings.
 *
 * Every text field is optional and blank-tolerant: empty / absent → the current i18n message of
 * the visitor's locale (EN = the literal the page showed before this spec), so an all-blank row
 * renders the page unchanged. URLs are not editable (the owner panel's button stays `#estimate`).
 *
 * `defaultBuildings` holds the blank texts plus the three current figures: the migration that
 * creates the row (drizzle 0017), the render fallback (no row / invalid row) and the tests.
 * See docs/data-model.md → Page content model → buildings.
 */
import { z } from "zod";
import { seoShape, tStrOpt } from "@core/validation/primitives";
import {
  between,
  estimateContactStep,
  estimateDoneStep,
  optionalAnimated,
  optionalImage,
  statFigure,
} from "./_shared";

/** Same text as Owners' hero (`owners.ts` → `HERO_IMG_HINT`). */
const HERO_IMG_HINT =
  "Full-bleed hero background (a dark overlay is applied). Landscape 16:9 — 1920×1080 px (min 1600×900), JPG or WebP, under 500 KB.";
/**
 * Calculator side media: photo, animated WebP, MP4/WebM loop or Lottie in the fixed 4:5 frame —
 * the same text as Home's guests pitch and Owners' services/dashboard (`SHOWCASE_MEDIA_HINT`).
 */
const CALC_MEDIA_HINT =
  "Portrait 4:5 — the frame is fixed at 4:5, so other ratios are cropped. Photo: 1200×1500 px (min 960×1200), JPG/WebP, under 500 KB. Video: MP4 (H.264), 1080×1350 or 1200×1500, no audio, 6–15 s loop, under 10 MB. Animated WebP: 1200×1500, under 5 MB. Lottie (.lottie or .json): 4:5 canvas (e.g. 1200×1500).";

/**
 * Stock fallbacks the render uses when no asset is picked (moved here from the slice
 * `buildings` listing for spec S2; the `alt`s stay English, as on Owners).
 */
export const BUILDINGS_HERO_IMG =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
export const BUILDINGS_HERO_ALT = "Rooftops and the river over Lisbon's historic centre at golden hour";
export const BUILDINGS_CALC_FALLBACK_IMG =
  "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1200";
export const BUILDINGS_CALC_FALLBACK_ALT = "A bright, professionally staged Central Hill managed apartment";

/**
 * A figure of this page's band: the shared `statFigure` plus the second line the band shows
 * under the label. Local — `statFigure` itself is untouched (Home/Owners have no description).
 */
const buildingsFigure = statFigure.extend({
  description: tStrOpt({ max: 120 }).describe("Second line under the label. Leave blank for none."),
});

export const buildingsSchema = z.object({
  /** Search/social meta for `/<locale>/buildings`. Blank → `pages.buildings.metaTitle` / `metaDescription`. */
  seo: z.object({ ...seoShape }).optional(),
  /** Blank → `pages.buildings.hero*`; the contact button/dialog → `pages.owners.contact*`. */
  hero: z
    .object({
      image_media_id: optionalImage(HERO_IMG_HINT),
      eyebrow: tStrOpt({ max: 60 }).describe("Leave blank for “Lisbon · Portugal”."),
      headline: tStrOpt({ max: 160 }).describe("Leave blank for “Strategic Properties in Prime Locations”."),
      copy: tStrOpt({ max: 600 }).describe(
        "Leave blank for “Explore our carefully curated portfolio of exceptional buildings — each handpicked for its location, character, and guest experience across Portugal's most vibrant neighbourhoods.”",
      ),
      contact: z
        .object({
          label: tStrOpt({ max: 40 }).describe("Button text. Leave blank for “Contact Us”."),
          title: tStrOpt({ max: 80 }).describe("Title of the contact dialog the button opens. Leave blank for “Contact us”."),
          intro: tStrOpt({ max: 280 }).describe(
            "Intro line of the contact dialog. Leave blank for “Send us a message and our team will get back to you shortly.”",
          ),
        })
        .optional(),
    })
    .optional(),
  /**
   * "For Owners" panel under the building grid. The button always scrolls to `#estimate`.
   * Blank → `pages.buildings.owner*`; a blank contact line is built from Settings ("Call {phone}
   * · email · WhatsApp", like Owners' closing CTA).
   */
  owner_panel: z
    .object({
      eyebrow: tStrOpt({ max: 60 }).describe("Leave blank for “For Owners”."),
      title: tStrOpt({ max: 160 }).describe("Leave blank for “Looking to add your property to our portfolio?”."),
      body: tStrOpt({ max: 400 }).describe(
        "Leave blank for “Join the buildings above. We'll assess your apartment and show you what it could earn — free, no obligation, within 48 hours.”",
      ),
      cta_label: tStrOpt({ max: 80 }).describe("Leave blank for “Get Your Free Earnings Estimate →”."),
      contact_line: tStrOpt({ max: 200 }).describe(
        "Leave blank to build it from Settings (phone · email · WhatsApp).",
      ),
    })
    .optional(),
  /**
   * Figures band: the page's own rows (0–8), number + affixes shared across locales, `label` /
   * `description` [T]. No rows → the band is hidden, heading included. Heading blank →
   * `pages.buildings.statsTitle`.
   */
  stats: z
    .object({
      title: tStrOpt({ max: 160 }).describe("Leave blank for “Numbers That Speak for Themselves”."),
      figures: between(buildingsFigure, 0, 8),
    })
    .optional(),
  /**
   * Earnings calculator (`#estimate`) — the Owners wizard. Step 1 blank → `pages.buildings.calc*`;
   * steps 2/3 share Owners' shapes (blank → `pages.estimateForm.*`). No media → the stock photo.
   */
  calculator: z
    .object({
      badge: tStrOpt({ max: 60 }).describe("Highlighted badge at the top of the card. Leave blank for “Earn +25%”."),
      headline: tStrOpt({ max: 160 }).describe("Leave blank for “Discover your property's earning potential”."),
      subheadline: tStrOpt({ max: 280 }).describe(
        "Leave blank for “Find out how much your property could earn — free, instant, no obligation.”",
      ),
      cta_label: tStrOpt({ max: 80 }).describe(
        "The arrow is added automatically. Leave blank for “Calculate My Earnings”.",
      ),
      contact_step: estimateContactStep,
      done_step: estimateDoneStep,
      media_media_id: optionalAnimated(CALC_MEDIA_HINT),
    })
    .optional(),
});

export type BuildingsContent = z.infer<typeof buildingsSchema>;

/** Blank texts + the three figures the page has always shown (spec → `defaultBuildings`). */
export const defaultBuildings: BuildingsContent = {
  stats: {
    figures: [
      {
        label: "Bookings Completed",
        to: "400000",
        suffix: "+",
        group: true,
        description: "Across all managed properties",
      },
      {
        label: "Years of Experience",
        to: "12",
        suffix: "+",
        group: false,
        description: "Optimizing owner returns in Portugal",
      },
      {
        label: "Revenue Generated",
        to: "55",
        prefix: "€",
        suffix: "M+",
        group: false,
        description: "For our property owners",
      },
    ],
  },
};
