/**
 * Card/section helpers shared by the editable fixed-page schemas (slice `pages`).
 * These mirror the repeating groups in the mockups; repeats are FIXED-COUNT
 * arrays (the admin form shows N slots, never "add block") per ADR 0012.
 */
import { z } from "zod";
import { iconKey, tStr } from "@core/validation/primitives";

/** The ubiquitous "icon + title + description" card (benefits, features…). */
export const iconCard = z.object({
  icon_key: iconKey,
  title: tStr({ max: 120 }),
  description: tStr({ max: 400 }),
});

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

/** Fixed-count array helper — the design repeats exactly `n` times. */
export const fixed = <T extends z.ZodType>(schema: T, n: number) =>
  z.array(schema).length(n);

/** Range-count array helper — between `min` and `max` repeats. */
export const between = <T extends z.ZodType>(schema: T, min: number, max: number) =>
  z.array(schema).min(min).max(max);
