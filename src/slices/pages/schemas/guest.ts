/**
 * `guest` (guests landing) page content schema (ADR 0012). Source-locale only.
 * Composed at render time — these are NOT stored here:
 *   - featured portfolio cards → buildings slice (`is_featured`, by position)
 *   - guest reviews → testimonials slice (`audience='guest'`, managed in /admin/testimonials);
 *     its heading is i18n chrome (`pages.reviews.titleGuests`), so the page owns no
 *     testimonials block at all
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
import { cta, ctaWithNote, tStr, tStrOpt, url } from "@core/validation/primitives";
import { faqGroupKey, fixed, iconCard, optionalImage, optionalVideo } from "./_shared";
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
const WELCOME_IMG_HINT =
  "Welcome section photo. Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB. Leave blank to use the approved stock photo.";

/** One side of the closing two-column CTA band (the mock's `.dual`). No image. */
const dualPanel = z.object({
  eyebrow: tStrOpt({ max: 60 }),
  title: tStr({ max: 160 }),
  body: tStr({ max: 400 }),
  cta: guestCta,
});

export const guestSchema = z.object({
  hero: z.object({
    video_media_id: optionalVideo(HERO_VIDEO_HINT),
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
    image_media_id: optionalImage(WELCOME_IMG_HINT),
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
    items: fixed(iconCard, 6),
    cta: guestCtaWithNote,
  }),
  activities_teaser: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(iconCard, 6),
    cta: guestCtaWithNote,
  }),
  /** Closing band: guest panel left, owner panel right (mock order). Contact line = settings. */
  dual_cta: z.object({
    guest: dualPanel,
    owner: dualPanel,
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type GuestContent = z.infer<typeof guestSchema>;
