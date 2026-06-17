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

/**
 * A management-plan column. `commission` is the headline percentage shown in a circle
 * above the card (client feedback B8); `features` is the cumulative bullet list (each
 * plan adds to the previous one). Both the number of plans and the rows per plan are
 * freely editable in the back office.
 */
const tier = z.object({
  name: tStr({ max: 80 }),
  tag: tStrOpt({ max: 80 }),
  /** Headline commission, e.g. "15%". Shown in the circle above the column. */
  commission: tStrOpt({ max: 20 }),
  is_popular: z.boolean(),
  features: between(tStr({ max: 200 }), 1, 20),
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
