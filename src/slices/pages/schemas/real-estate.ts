/**
 * `real_estate` page content schema (ADR 0012). Source-locale values only.
 * Composed at render time: FAQ (group 'real_estate') → faq slice.
 * The enquiry form *fields* are fixed in code → lead.kind='deal_enquiry'.
 * Partners / capabilities / asset classes / track record are marketing copy
 * here, NOT entities (confirmed against the brief).
 * See docs/data-model.md → Page content model → real_estate.
 */
import { z } from "zod";
import { mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { between, fixed, iconCard, step } from "./_shared";

/** An investment model card (e.g. lease / management / JV). */
const model = z.object({
  name: tStr({ max: 80 }),
  tag: tStrOpt({ max: 80 }),
  is_featured: z.boolean(),
  features: fixed(tStr({ max: 200 }), 7),
});

/** A market-insight block: a title plus EITHER prose copy OR a bullet list. */
const marketBlock = z
  .object({
    title: tStr({ max: 120 }),
    copy: tStrOpt({ max: 800 }),
    bullets: between(tStr({ max: 200 }), 1, 8).optional(),
  })
  .refine((b) => b.copy !== undefined || b.bullets !== undefined, {
    message: "market block needs either copy or bullets",
  });

/** A headline figure (value is a non-translated figure; label/caption are prose). */
const metric = z.object({
  value: z.string().min(1).max(40),
  label: tStr({ max: 120 }),
  caption: tStrOpt({ max: 200 }),
});

export const realEstateSchema = z.object({
  hero: z.object({
    image_media_id: mediaId,
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    positioning: tStr({ max: 600 }),
    capability_statement_media_id: mediaId.optional(),
    cta_primary: z.object({ label: tStr({ max: 80 }), url: z.url() }),
    cta_secondary: z.object({ label: tStr({ max: 80 }), url: z.url() }),
  }),
  partners: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    types: fixed(iconCard, 4),
  }),
  capabilities: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(iconCard, 3),
  }),
  asset_classes: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(iconCard, 6),
  }),
  models: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(model, 3),
    footer_note: tStrOpt({ max: 400 }),
  }),
  market: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    blocks: fixed(marketBlock, 4),
  }),
  track_record: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    metrics: fixed(metric, 6),
  }),
  process: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    steps: fixed(step, 5),
  }),
  enquiry: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    contact_email: z.email(),
    contact_phone: z.string().min(3).max(40),
    contact_linkedin: z.url(),
  }),
});

export type RealEstateContent = z.infer<typeof realEstateSchema>;
