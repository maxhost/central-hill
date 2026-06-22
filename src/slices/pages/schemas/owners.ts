/**
 * `owners` page content schema (ADR 0012). Source-locale values only.
 * The page is a focused conversion landing: hero + earnings form, the "numbers" band
 * (composed at render time from company_settings), and the closing CTA.
 * The earnings form *fields* are fixed in code → lead.kind='earnings_estimate'.
 *
 * The former marketing sections (`why` / `services` / `plans` / `journey` / `dashboard`)
 * were removed from the public page and the back office (owner direction); their stored
 * keys are dropped by drizzle/0004. The hero badge now lives inside the earnings-form card
 * (moved + highlighted), so it is authored under `earnings_form.badge`.
 * See docs/data-model.md → Page content model → owners.
 */
import { z } from "zod";
import { tStr, tStrOpt } from "@core/validation/primitives";

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
});

export type OwnersContent = z.infer<typeof ownersSchema>;
