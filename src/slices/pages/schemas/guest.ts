/**
 * `guest` (guests landing) page content schema (ADR 0012). Source-locale only.
 * Composed at render time — these are NOT stored here:
 *   - featured portfolio cards → buildings slice (`is_featured`, by position)
 *   - guest reviews → testimonials slice (`audience='guest'`, managed in /admin/testimonials);
 *     only the section heading is authored here (`testimonials`, optional — blank → the
 *     i18n `pages.reviews.eyebrow` / `titleGuests`)
 *   - the dual-CTA contact line (phone / email / WhatsApp) → company_settings
 *   - the optional FAQ accordion → faq slice, chosen by `faq_group_key`
 * Every other section on the page is authored here and edited at /admin/pages/guest.
 * Button URLs are hidden in the editor (spec guests-admin-editor → "Campos ocultos"): the
 * render sends each button to a fixed locale-relative route, so the stored `url`s are kept
 * (round-tripped unchanged on save) but no longer used.
 * See docs/data-model.md → Page content model → guest, and
 * docs/specs/guest-page-db-wiring.md.
 */
import { z } from "zod";
import { cta, ctaWithNote, seoShape, tStr, tStrOpt, url } from "@core/validation/primitives";
import {
  faqGroupKey,
  fixed,
  iconCard,
  optionalAnimated,
  optionalIconKey,
  optionalImage,
  optionalVideo,
} from "./_shared";
import { adminHidden } from "./admin-hidden";

/**
 * A button URL kept in `data` but hidden in the editor (spec guests-admin-editor → "Destinos
 * de los botones"): where each button points is fixed in code (`/{locale}/buildings`,
 * `/services`, `/guides`, …), so staff never see or edit it. The stored value round-trips
 * unchanged on save.
 */
const hiddenUrl = adminHidden(url);
/** Local variant of the kernel `cta` with its `url` hidden in the editor. */
const guestCta = cta.extend({ url: hiddenUrl });
/** Local variant of the kernel `ctaWithNote` with its `url` hidden in the editor. */
const guestCtaWithNote = ctaWithNote.extend({ url: hiddenUrl });

/** Uploader guidance surfaced in the admin media pickers (form-model reads `.describe`). */
const HERO_VIDEO_HINT =
  "Hero background video (MP4, H.264). Landscape 16:9 — recommended 1920×1080, under 8 MB. Leave blank to use the approved stock clip.";
/** Home's hero poster hint, verbatim (spec guests-admin-editor S3). */
const HERO_POSTER_HINT =
  "Shown while the video loads and when it can't play. Use a still from the video. 1920×1080 (16:9), JPG or WebP, under 400 KB.";
/**
 * Welcome side media (spec guests-admin-editor S3): photo, MP4/WebM loop, animated WebP or
 * Lottie. `IntroSplit`'s media cell is landscape (min-height 380px beside a ~540px column on
 * desktop, a full-width 280px strip at ≤880px) and covers it, so the hint asks for 3:2.
 */
const WELCOME_MEDIA_HINT =
  "Landscape 3:2 — the frame is about 540×380 px on desktop and a full-width strip 280 px tall on tablet/mobile, and the media is cropped to fill it, so keep the subject centred. Photo: 1500×1000 px (min 1200×800), JPG/WebP, under 500 KB. Video: MP4 (H.264), 1500×1000 or 1200×800, no audio, 6–15 s loop, under 10 MB. Animated WebP: 1200×800, under 5 MB. Lottie (.lottie or .json): 3:2 canvas (e.g. 1200×800).";

/**
 * Teaser card photo (spec guests-admin-editor S4). `PhotoFeatureGrid` cards are `min-h-[260px]`,
 * `bg-cover bg-center` under a dark scrim: ~377×260 px in the desktop 3-column grid (1184px
 * column, 26px gaps), ~360×260 at 2 columns and up to ~584×260 at 1 column — about 3:2 at
 * desktop, cropped wider/narrower elsewhere, hence "centre-cropped".
 */
const TEASER_CARD_HINT =
  "Card background (a dark overlay is applied, centre-cropped). Landscape 3:2 — 1200×800 px (min 900×600), JPG or WebP, under 300 KB.";
/**
 * A teaser card: the shared `iconCard` plus an optional photo (S4). Local, so Home's
 * `iconCard` uses are unchanged. "" / absent → the stock photo at that position.
 */
const teaserCard = iconCard.extend({ image_media_id: optionalImage(TEASER_CARD_HINT).optional() });

/** One side of the closing two-column CTA band (the mock's `.dual`). No image. */
const dualPanel = z.object({
  eyebrow: tStrOpt({ max: 60 }),
  title: tStr({ max: 160 }),
  body: tStr({ max: 400 }),
  cta: guestCta,
});

/**
 * The owner side (S5): its button opens the contact dialog (the header's `ContactDialog`), so it
 * also carries the dialog's optional copy. Blank / absent → `settings.contactDialog.title` /
 * `intro`, exactly the header dialog's texts.
 */
const ownerPanel = dualPanel.extend({
  contact: z
    .object({
      title: tStrOpt({ max: 80 }).describe("Title of the contact dialog the button opens. Leave blank for “Contact us”."),
      intro: tStrOpt({ max: 280 }).describe(
        "Intro line of the contact dialog. Leave blank for “Send us a message and our team will get back to you shortly.”",
      ),
    })
    .optional(),
});

/*
 * Optional copy overrides added by spec `guests-admin-editor` S2 (`seo`, `testimonials`, `faq`).
 * Every one is optional and blank-tolerant: empty / absent → the page renders the current i18n
 * message of the visitor's locale, so a row saved before these keys existed renders exactly as
 * before.
 */
export const guestSchema = z.object({
  /** Search/social meta for `/<locale>/guests`. Blank → `pages.guests.metaTitle` / `metaDescription`. */
  seo: z.object({ ...seoShape }).optional(),
  hero: z.object({
    video_media_id: optionalVideo(HERO_VIDEO_HINT),
    /** Optional (S3): "" / absent → the stock poster. Optimized via `heroPosterSrc`. */
    poster_media_id: optionalImage(HERO_POSTER_HINT).optional(),
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    cta: guestCta,
  }),
  welcome: z.object({
    headline: tStr({ max: 160 }),
    lede: tStr({ max: 400 }),
    copy: tStr({ max: 1200 }),
    guarantee_label: tStrOpt({ max: 120 }),
    /** Optional (S3): blank → the `percentage-circle` icon. */
    guarantee_icon_key: optionalIconKey,
    /** S3: image / MP4-WebM loop / animated WebP / Lottie (was image-only; compatible). */
    image_media_id: optionalAnimated(WELCOME_MEDIA_HINT),
    /** Optional (S3): blank → the asset's alt → `pages.guests.welcomeAlt`. */
    image_alt: tStrOpt({ max: 160 }).describe(
      "Describe the photo for screen readers and search. Leave blank to use the uploaded file's alt text.",
    ),
  }),
  why: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    benefits: fixed(iconCard, 4),
    cta: guestCtaWithNote,
  }),
  /** Headings + CTA only — the cards come from the buildings slice at render time. */
  portfolio: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    cta: guestCtaWithNote,
  }),
  services_teaser: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(teaserCard, 6),
    cta: guestCtaWithNote,
  }),
  activities_teaser: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(teaserCard, 6),
    cta: guestCtaWithNote,
  }),
  /**
   * Closing band: guest panel left, owner panel right (mock order). Contact line = settings.
   * The owner button opens the contact dialog (S5); its stored `cta.url` is unused.
   */
  dual_cta: z.object({
    guest: dualPanel,
    owner: ownerPanel,
  }),
  /**
   * Testimonials heading (the reviews come from the testimonials slice, `audience='guest'`).
   * Blank → `pages.reviews.eyebrow` / `pages.reviews.titleGuests`; blank intro → no intro.
   */
  testimonials: z
    .object({
      eyebrow: tStrOpt({ max: 60 }).describe("Leave blank for “Reviews”."),
      title: tStrOpt({ max: 160 }).describe("Leave blank for “We Care About Our Guests”."),
      intro: tStrOpt({ max: 400 }).describe("Short line under the title. Leave blank for none."),
    })
    .optional(),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
  /** FAQ section heading (the group stays in `faq_group_key`). Blank → `pages.faqTitle`. */
  faq: z
    .object({ title: tStrOpt({ max: 160 }).describe("Leave blank for “Frequently Asked Questions”.") })
    .optional(),
});

export type GuestContent = z.infer<typeof guestSchema>;
