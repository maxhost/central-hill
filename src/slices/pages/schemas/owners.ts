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
import { ctaWithNote, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { between, fixed, iconCard, step } from "./_shared";

/**
 * An image reference that may be left unset. An empty string means "no asset yet" — the
 * public render falls back to the approved mock photo (R2 isn't wired yet). Accepts a
 * `media_asset.id` once uploaded. `.describe()` becomes the admin uploader hint.
 */
const optionalImage = (hint: string) => z.union([z.literal(""), mediaId]).describe(hint);
const SERVICES_IMG_HINT =
  "Lifestyle photo for the Services showcase. Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";
const DASHBOARD_IMG_HINT =
  "Image for the owner-dashboard showcase (e.g. an interface/laptop shot). Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";

/** A management-plan column (cumulative bullet list; `commission` shown above the card). */
const tier = z.object({
  name: tStr({ max: 80 }),
  tag: tStrOpt({ max: 80 }),
  commission: tStrOpt({ max: 20 }),
  is_popular: z.boolean(),
  features: between(tStr({ max: 200 }), 1, 20),
});

/** A helper block beside the plans (e.g. "not sure which plan?"). */
const planHelper = z.object({
  title: tStr({ max: 120 }),
  copy: tStr({ max: 400 }),
  cta: z.object({ label: tStr({ max: 80 }), url: z.url() }).optional(),
});

export const ownersSchema = z.object({
  hero: z.object({
    image_media_id: z.uuid(),
    headline: tStr({ max: 160 }),
    copy: tStr({ max: 600 }),
  }),
  earnings_form: z.object({
    /** Highlighted badge shown at the top of the form card (e.g. "★ Earn +25%"). */
    badge: tStrOpt({ max: 60 }),
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    cta_label: tStr({ max: 80 }),
    note: tStrOpt({ max: 280 }),
  }),
  // "Why owners trust us" — Editorial Split (sticky title + CTAs beside a hairline benefit list).
  why: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 6),
    cta_primary: ctaWithNote,
    cta_secondary: ctaWithNote,
  }),
  // "Everything we handle" — Image Showcase (the home guests-pitch layout): headline + benefit
  // highlights + CTA beside a 4:5 lifestyle image with a floating reassurance badge.
  services: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    image_media_id: optionalImage(SERVICES_IMG_HINT),
    cta: ctaWithNote,
  }),
  plans: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    tiers: between(tier, 1, 6),
    helpers: fixed(planHelper, 2),
  }),
  journey: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    steps: fixed(step, 5),
  }),
  // "Your property, always in sight" — Image Showcase mirrored (image on the left): the owner
  // dashboard pitch as benefit highlights + CTA beside a 4:5 image with a floating badge.
  dashboard: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    image_media_id: optionalImage(DASHBOARD_IMG_HINT),
    cta: ctaWithNote,
  }),
});

export type OwnersContent = z.infer<typeof ownersSchema>;
