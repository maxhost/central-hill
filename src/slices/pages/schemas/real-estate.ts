/**
 * `real_estate` page content schema (ADR 0012). Source-locale values only.
 *
 * The page body (hero copy aside) is a STATIC marketing layout in the renderer
 * (`ui/real-estate-page.tsx`), not DB-driven — so the editable schema is kept to the
 * **hero** plus the optional **FAQ group** (the one field that actually drives the
 * page: it gates the shared FAQ island). The former partners / capabilities /
 * asset-classes / deal-structures / market / track-record / process / enquiry sections
 * were removed from the schema (client direction): they rendered nothing yet cluttered
 * the `/admin/pages/real_estate` editor. Re-add a section here if/when it becomes
 * DB-driven. See docs/data-model.md → Page content model → real_estate.
 */
import { z } from "zod";
import { mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { faqGroupKey } from "./_shared";

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
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type RealEstateContent = z.infer<typeof realEstateSchema>;
