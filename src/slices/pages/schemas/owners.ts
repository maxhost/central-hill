/**
 * `owners` page content schema (ADR 0012). Source-locale values only.
 * Composed at render time (NOT in `data`): stats band ("numbers") → company_settings.
 * The earnings form *fields* are fixed in code → lead.kind='earnings_estimate'.
 *
 * Section design notes (owner direction):
 * - the per-section *eyebrow* labels were dropped on the page (titles stay);
 * - the hero badge lives inside the earnings-form card (moved + highlighted) → `earnings_form.badge`;
 * - `why` uses the home's Editorial-Split layout, so it carries a subheadline + two CTAs.
 * All marketing sections are kept and editable here so the back office is ready for when the
 * page is wired to the DB (drizzle 0004→0006).
 * See docs/data-model.md → Page content model → owners.
 */
import { z } from "zod";
import { ctaWithNote, seoShape, tStr, tStrOpt, url } from "@core/validation/primitives";
import {
  between,
  faqGroupKey,
  fixed,
  iconCard,
  optionalIconKey,
  optionalImage,
  statFigure,
  step,
} from "./_shared";
import { adminHidden } from "./admin-hidden";

/**
 * A button URL kept in `data` but hidden in the editor (spec owners-admin-editor → "Campos
 * ocultos"): where a button points is decided in code (the render uses `#worth` / `#start` /
 * `#`), so staff never see or edit it. The stored value round-trips unchanged on save.
 */
const hiddenUrl = adminHidden(url);
/** Local variant of the kernel `ctaWithNote` with its `url` hidden in the editor. */
const ownersCta = ctaWithNote.extend({ url: hiddenUrl });

const HERO_IMG_HINT =
  "Full-bleed hero background (a dark overlay is applied). Landscape 16:9 — 1920×1080 px (min 1600×900), JPG or WebP, under 500 KB.";
const SERVICES_IMG_HINT =
  "Lifestyle photo for the Services showcase. Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";
const DASHBOARD_IMG_HINT =
  "Image for the owner-dashboard showcase (e.g. an interface/laptop shot). Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";
const JOURNEY_STEP_IMG_HINT =
  "Background photo for this step card (dark gradient overlay is applied — busy top area, calmer bottom works best). Portrait 3:4 — recommended 900×1200px, JPG or WebP, under 400 KB.";

/** A management-plan column (cumulative bullet list). */
const tier = z.object({
  name: tStr({ max: 80 }),
  tag: tStrOpt({ max: 80 }),
  /** Never rendered on the page (the visible % is `corner_badge`) → hidden in the editor. */
  commission: adminHidden(tStrOpt({ max: 20 })),
  /** Short figure in the card's corner badge (e.g. "10%", "+5%") — extra-earnings callout. */
  corner_badge: tStrOpt({ max: 12 }),
  is_popular: z.boolean(),
  features: between(tStr({ max: 200 }), 1, 20),
});

/** A `journey` step (client direction: each of the 5 cards gets a background photo). Local
 * extension of the shared `step` — the image only makes sense for this page's photo-card
 * treatment, so it doesn't belong on the shared shape (Real Estate reuses plain `step`). */
const journeyStep = step.extend({
  image_media_id: optionalImage(JOURNEY_STEP_IMG_HINT),
});

/** The single full-width highlighted helper band below the plans (e.g. "not sure which plan?"). */
const planHelper = z.object({
  title: tStr({ max: 120 }),
  copy: tStr({ max: 400 }),
  cta: z.object({ label: tStr({ max: 80 }), url: hiddenUrl }).optional(),
});

/**
 * A showcase image's floating reassurance badge (spec owners-admin-editor S2). Blank label →
 * the section's i18n badge; blank icon → the component's default icon.
 */
const showcaseBadge = z
  .object({
    label: tStrOpt({ max: 120 }).describe("Text on the image's floating badge. Leave blank for the current default."),
    icon_key: optionalIconKey,
  })
  .optional();

/*
 * Optional copy overrides added by spec `owners-admin-editor` S2 (`seo`, `hero.contact`,
 * `services.badge`, `dashboard.badge`, `plans.popular_label` / `choose_label`, `testimonials`,
 * `faq`). Every one is optional and blank-tolerant: empty / absent → the page renders the
 * current i18n message of the visitor's locale, so a row saved before these keys existed
 * renders exactly as before.
 */
export const ownersSchema = z.object({
  /** Search/social meta for `/<locale>/owners`. Blank → `pages.owners.metaTitle` / `metaDescription`. */
  seo: z.object({ ...seoShape }).optional(),
  hero: z.object({
    // Optional since spec owners-admin-editor S1: "" → the stock hero photo.
    image_media_id: optionalImage(HERO_IMG_HINT),
    headline: tStr({ max: 160 }),
    copy: tStr({ max: 600 }),
    /**
     * The hero's Contact button and the dialog it opens. Blank → `pages.owners.contactLabel`
     * / `contactTitle` / `contactIntro`.
     */
    contact: z
      .object({
        label: tStrOpt({ max: 40 }).describe("Button text. Leave blank for “Contact Us”."),
        title: tStrOpt({ max: 80 }).describe("Title of the contact dialog the button opens. Leave blank for “Contact us”."),
        intro: tStrOpt({ max: 280 }).describe(
          "Intro line of the contact dialog. Leave blank for “Send us a message and our team will get back to you shortly.”",
        ),
      })
      .optional(),
  }),
  earnings_form: z.object({
    /** Highlighted badge shown at the top of the form card (e.g. "★ Earn +25%"). */
    badge: tStrOpt({ max: 60 }),
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    cta_label: tStr({ max: 80 }),
    note: tStrOpt({ max: 280 }),
  }),
  /** Animated "numbers" band (#numbers) — per-page figures, not the global company stats. */
  stats: fixed(statFigure, 4),
  // "Why owners trust us" — Editorial Split (sticky title + CTAs beside a hairline benefit list).
  why: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 6),
    cta_primary: ownersCta,
    cta_secondary: ownersCta,
  }),
  // "Everything we handle" — Image Showcase (the home guests-pitch layout): headline + benefit
  // highlights + CTA beside a 4:5 lifestyle image with a floating reassurance badge.
  services: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    image_media_id: optionalImage(SERVICES_IMG_HINT),
    cta: ownersCta,
    /** Blank label → `pages.owners.servicesBadge`. */
    badge: showcaseBadge,
  }),
  plans: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    tiers: between(tier, 1, 4),
    // Single full-width highlighted helper band below the plans (drizzle 0010 trimmed 2→1).
    helpers: fixed(planHelper, 1),
    /** The popular tier's pill. Blank → `pages.owners.popular`. */
    popular_label: tStrOpt({ max: 30 }).describe("Leave blank for “Most Popular”."),
    /** Each tier's button; `{name}` = the tier name. Blank → `pages.owners.choosePlan`. */
    choose_label: tStrOpt({ max: 60 }).describe(
      "Use {name} for the plan name, e.g. “Choose {name}”. Leave blank for “Choose {name}”.",
    ),
  }),
  journey: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    steps: fixed(journeyStep, 5),
  }),
  // "Your property, always in sight" — Image Showcase mirrored (image on the left): the owner
  // dashboard pitch as benefit highlights + CTA beside a 4:5 image with a floating badge.
  dashboard: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    image_media_id: optionalImage(DASHBOARD_IMG_HINT),
    cta: ownersCta,
    /** Blank label → `pages.owners.dashboardBadge`. */
    badge: showcaseBadge,
  }),
  /** Testimonials heading (the reviews come from `testimonials`). Blank → `pages.reviews.title`. */
  testimonials: z
    .object({
      title: tStrOpt({ max: 160 }).describe("Leave blank for “We Care About Our Partners & Guests”."),
    })
    .optional(),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
  /** FAQ section heading (the group stays in `faq_group_key`). Blank → `pages.owners.faqTitle`. */
  faq: z
    .object({ title: tStrOpt({ max: 160 }).describe("Leave blank for “Owner Questions, Answered”.") })
    .optional(),
});

export type OwnersContent = z.infer<typeof ownersSchema>;
