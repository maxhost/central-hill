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

/**
 * An image reference that may be left unset. An empty string means "no asset yet" — the
 * public render falls back to the approved mock photo (R2 isn't wired yet). Accepts a
 * `media_asset.id` once uploaded. `.describe()` becomes the admin uploader hint.
 */
const optionalImage = (hint: string) => z.union([z.literal(""), mediaId]).describe(hint);
const ASSET_IMG_HINT =
  "Lifestyle photo for the Asset Types showcase. Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";

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
  // "A Management Partner for Every Asset Type" — Image Showcase (the home guests-pitch /
  // owners services layout): headline + subheadline + four benefit highlights + CTA beside a
  // 4:5 lifestyle image with a floating reassurance badge (the CTA note). Benefit icons are
  // positional in the renderer; `icon_key` is stored but not rendered.
  asset_management: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    image_media_id: optionalImage(ASSET_IMG_HINT),
    cta: ctaWithNote,
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type RealEstateContent = z.infer<typeof realEstateSchema>;
