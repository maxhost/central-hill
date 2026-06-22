/**
 * `owners` page content schema (ADR 0012). Source-locale values only.
 * The page is a focused conversion landing: hero + earnings form, the "numbers" band
 * (composed at render time from company_settings), an editorial "why owners trust us"
 * section, and the closing CTA.
 * The earnings form *fields* are fixed in code → lead.kind='earnings_estimate'.
 *
 * Owner direction (drizzle/0004 + 0005): the `services / plans / journey / dashboard`
 * marketing sections were removed; the `why` section was kept but redesigned to the home's
 * Editorial-Split layout (headline + CTAs beside a hairline benefit list), so it carries
 * CTAs + a subheadline now. The hero badge lives inside the earnings-form card (moved +
 * highlighted) → authored under `earnings_form.badge`.
 * See docs/data-model.md → Page content model → owners.
 */
import { z } from "zod";
import { ctaWithNote, tStr, tStrOpt } from "@core/validation/primitives";
import { fixed, iconCard } from "./_shared";

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
  // "Why owners trust us" — Editorial Split (sticky text + CTAs beside a hairline benefit list).
  why: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 6),
    cta_primary: ctaWithNote,
    cta_secondary: ctaWithNote,
  }),
});

export type OwnersContent = z.infer<typeof ownersSchema>;
