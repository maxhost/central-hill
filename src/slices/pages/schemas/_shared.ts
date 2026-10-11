/**
 * Card/section helpers shared by the editable fixed-page schemas (slice `pages`).
 * These mirror the repeating groups in the mockups; repeats are FIXED-COUNT
 * arrays (the admin form shows N slots, never "add block") per ADR 0012.
 */
import { z } from "zod";
import { iconKey } from "@core/validation/icon-key";
import { mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { withMediaAccept } from "./media-accept";

/** The ubiquitous "icon + title + description" card (benefits, features…). */
export const iconCard = z.object({
  icon_key: iconKey,
  title: tStr({ max: 120 }),
  description: tStr({ max: 400 }),
});

/**
 * An icon that may be left unset: `""` (or absent) → the render's default icon. The editor's
 * `applyDefaults` scaffolds a blank icon as `""`, so the blank literal must validate. The
 * `icon_key` field name drives the form-model's icon picker (optional → "none" allowed).
 * Not a [T] field.
 */
export const optionalIconKey = z.union([z.literal(""), iconKey]).optional();

/**
 * A compact "icon + label" reassurance mark — the trust strip that sits under a section
 * heading (e.g. "Exclusive Selection", "24h Customer Support"). Unlike `iconCard` it has
 * no description: it is a one-line claim, not a benefit card.
 */
export const assurance = z.object({
  icon_key: iconKey,
  label: tStr({ max: 60 }),
});

/**
 * Optional reference to a `services` slice **category**, by its language-neutral `slug`.
 * An empty string (or absent) means "every published service". Rendered as a dropdown fed
 * by `services.listServiceCategories` — the `service_category_slug` field name drives the
 * form-model's select heuristic, exactly like `faq_group_key`. Not a [T] field (the slug is
 * language-neutral), so the translation pipeline skips it.
 */
export const serviceCategorySlug = z
  .union([z.literal(""), z.string().max(120)])
  .describe(
    "Limit the carousel to one service category, or leave blank to show every published service.",
  )
  .optional();

/** A titled step with a description (journeys, processes) — no icon. */
export const step = z.object({
  title: tStr({ max: 120 }),
  description: tStr({ max: 400 }),
});

/** A titled item with a description, no icon (values, capabilities). */
export const titledItem = z.object({
  title: tStr({ max: 120 }),
  description: tStr({ max: 400 }),
});

/**
 * Optional reference to a `faq` slice group, by its language-neutral `key`. An empty string
 * (or absent) means "no FAQ on this page". The page editor renders this as a **dropdown** fed
 * by `faq.listFaqGroups` (the `faq_group_key` field name drives the form-model's select
 * heuristic, mirroring how `*_media_id` drives the media picker); the page renders the chosen
 * group through the shared `FaqSection`. Not a [T] field — the key is language-neutral, so the
 * translation pipeline skips it.
 */
export const faqGroupKey = z
  .union([z.literal(""), z.string().max(120)])
  .describe("FAQ group shown on this page — pick one authored in /admin/faq, or leave blank for none.")
  .optional();

/**
 * An image (or video) reference that may be left unset. An empty string means "no asset yet" —
 * the public render then falls back to the approved mock photo. Accepts a `media_asset.id` once
 * something is uploaded. The `hint` becomes the uploader guidance shown in the admin picker
 * (the form-model reads `.describe()`).
 */
export const optionalImage = (hint: string) =>
  z.union([z.literal(""), mediaId]).describe(hint);

/**
 * A background video reference that may be left unset (`""` → the public render's stock
 * clip). Same shape as `optionalImage`, but the admin picker offers MP4 / WebM only.
 */
export const optionalVideo = (hint: string) =>
  withMediaAccept(z.union([z.literal(""), mediaId]), "video").describe(hint);

/**
 * A side-media reference that may be left unset: a photo, an animated WebP, an MP4/WebM
 * loop or a Lottie (`.json` / `.lottie`) — spec home-admin-editor S6. Same shape as
 * `optionalImage`; the public render picks the element by the asset's `mime`.
 */
export const optionalAnimated = (hint: string) =>
  withMediaAccept(z.union([z.literal(""), mediaId]), "animated").describe(hint);

/** Fixed-count array helper — the design repeats exactly `n` times. */
export const fixed = <T extends z.ZodType>(schema: T, n: number) =>
  z.array(schema).length(n);

/** Range-count array helper — between `min` and `max` repeats. */
export const between = <T extends z.ZodType>(schema: T, min: number, max: number) =>
  z.array(schema).min(min).max(max);

/**
 * One animated figure in a "numbers" band. Per-page (each page may want different figures) —
 * NOT the global company stats. `to` is the count-up target as a digit string (the counter
 * reads it via `Number(data-to)`); the displayed figure is derived as
 * prefix + (optionally grouped) to + suffix — so "400000"+group+"+" → "400,000+" and
 * "55"+"€"+"M+" → "€55M+" (`formatStatFigure` in `ui/stat-figure-value.ts`). Only `label` is
 * translated [T]; the number and its affixes are shared across locales.
 *
 * Shared since spec home-admin-editor S5: Owners uses exactly 4 (`fixed(statFigure, 4)`), the
 * Home a variable 0–8 (`between(statFigure, 0, 8)`). `label` comes first so the editor shows
 * the text before the number.
 */
export const statFigure = z.object({
  label: tStr({ max: 80 }),
  to: z
    .string()
    .regex(/^\d+$/, "Digits only — the count-up target (e.g. 400000).")
    .max(15)
    .describe("Count-up target, digits only. Enter 400000 for “400,000+”, 55 for “€55M+”."),
  prefix: z
    .string()
    .max(8)
    .optional()
    .describe("Symbol before the number, e.g. “€”. Leave blank for none."),
  suffix: z
    .string()
    .max(8)
    .optional()
    .describe("Symbol after the number, e.g. “+” or “M+”. Leave blank for none."),
  group: z.boolean().describe("Show thousands separators (e.g. 400,000)."),
});

/**
 * Earnings-estimate wizard, step 2 ("contact details") copy overrides. Blank →
 * `pages.estimateForm.contactTitle` / `contactLede` / `submit` / `back`; the "→" / "←" arrows
 * are added in code. Moved here unchanged from `owners.ts` (spec buildings-admin-editor) so
 * Owners' `earnings_form` and Buildings' `calculator` share one shape.
 */
export const estimateContactStep = z
  .object({
    title: tStrOpt({ max: 120 }).describe("Leave blank for “Your contact details”."),
    lede: tStrOpt({ max: 280 }).describe(
      "Leave blank for “Almost there — tell us how to reach you with the study.”",
    ),
    submit_label: tStrOpt({ max: 60 }).describe("The arrow is added automatically. Leave blank for “Submit request”."),
    back_label: tStrOpt({ max: 30 }).describe("The arrow is added automatically. Leave blank for “Back”."),
  })
  .optional();

/** Step 3 ("request received") copy overrides. Blank → `pages.estimateForm.doneTitle` / `doneBody`. */
export const estimateDoneStep = z
  .object({
    title: tStrOpt({ max: 120 }).describe("Leave blank for “Request received”."),
    body: tStrOpt({ max: 400 }).describe(
      "Leave blank for “Thank you — our team will review your property and get back to you within 48 hours with your free profitability study.”",
    ),
  })
  .optional();
