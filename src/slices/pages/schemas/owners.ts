/**
 * `owners` page content schema (ADR 0012). Source-locale values only.
 * Composed at render time (NOT in `data`):
 *   - stats band → company_settings
 *   - testimonials (audience='owner') → testimonials slice
 *   - FAQ (group 'owners') → faq slice
 * The earnings form *fields* are fixed in code → lead.kind='earnings_estimate'.
 * The per-section anchor sub-nav is derived from these fixed sections in code.
 * See docs/data-model.md → Page content model → owners.
 */
import { z } from "zod";
import { tStr, tStrOpt } from "@core/validation/primitives";
import { between, fixed, iconCard, step } from "./_shared";

/** A pricing tier card. `features` is 6–8 bullets (varies per tier). */
const tier = z.object({
  name: tStr({ max: 80 }),
  tag: tStrOpt({ max: 80 }),
  is_popular: z.boolean(),
  features: between(tStr({ max: 200 }), 6, 8),
});

/** A helper block beside the plans (e.g. "not sure which plan?"). */
const planHelper = z.object({
  title: tStr({ max: 120 }),
  copy: tStr({ max: 400 }),
  cta: z
    .object({ label: tStr({ max: 80 }), url: z.url() })
    .optional(),
});

export const ownersSchema = z.object({
  hero: z.object({
    image_media_id: z.uuid(),
    badge: tStrOpt({ max: 60 }),
    headline: tStr({ max: 160 }),
    copy: tStr({ max: 600 }),
  }),
  earnings_form: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    cta_label: tStr({ max: 80 }),
    note: tStrOpt({ max: 280 }),
  }),
  why: z.object({
    headline: tStr({ max: 160 }),
    benefits: fixed(iconCard, 6),
  }),
  services: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    items: fixed(iconCard, 9),
  }),
  plans: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    tiers: fixed(tier, 3),
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
