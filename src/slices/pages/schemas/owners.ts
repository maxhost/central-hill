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
import { ctaWithNote, tStr, tStrOpt } from "@core/validation/primitives";
import { between, fixed, iconCard, step } from "./_shared";

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
  services: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    items: fixed(iconCard, 9),
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
  dashboard: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    features: fixed(iconCard, 6),
  }),
});

export type OwnersContent = z.infer<typeof ownersSchema>;
