/**
 * `real_estate` page content schema (ADR 0012). Source-locale values only.
 *
 * Most of the page body (capabilities / asset-classes / deal-structures / market /
 * track-record / process / enquiry) is still a STATIC marketing layout in the renderer
 * (`ui/real-estate-page.tsx`). The DB-driven, editable parts are the **hero**, the
 * **partners** section ("Built for Institutional Partners" — an Editorial-Split block
 * modelled on the Owners "why" section: sticky title + two CTAs beside a four-item
 * benefit list), and the optional **FAQ group**. Re-add a further section here when it
 * becomes DB-driven. See docs/data-model.md → Page content model → real_estate.
 */
import { z } from "zod";
import { ctaWithNote, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { faqGroupKey, fixed, iconCard } from "./_shared";

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
  // "Built for Institutional Partners" — Editorial Split (sticky headline + subheadline +
  // two CTAs beside a hairline benefit list). Mirrors the Owners `why` section; the four
  // benefits are the four institutional partner types. Icons are positional in the
  // renderer (the design SVGs never change) — `icon_key` is stored but not rendered.
  partners: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    cta_primary: ctaWithNote,
    cta_secondary: ctaWithNote,
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type RealEstateContent = z.infer<typeof realEstateSchema>;
