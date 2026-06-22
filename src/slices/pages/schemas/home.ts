/**
 * `home` page content schema (ADR 0012). Source-locale values only.
 * Dynamic/shared content is NOT stored here — it is composed at render time:
 *   - stats band + dual-CTA contact → company_settings (settings slice)
 *   - featured portfolio → buildings (is_featured, top 3 by position)
 *   - testimonials (mixed audience) → testimonials slice
 * See docs/data-model.md → Page content model → home.
 */
import { z } from "zod";
import { cta, ctaWithNote, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { faqGroupKey, fixed, iconCard } from "./_shared";

/** Uploader guidance surfaced in the admin media pickers (form-model reads `.describe`). */
const GUESTS_IMG_HINT =
  "Lifestyle photo for the Guests section. Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";
const PANEL_IMG_HINT =
  "Panel background photo. Landscape — recommended 1600×1200px, JPG or WebP, under 600 KB.";

/**
 * An image reference that may be left unset. An empty string means "no asset yet" — the
 * public render then falls back to the approved mock photo (R2 isn't wired yet). Accepts a
 * `media_asset.id` once an image is uploaded. `.describe()` becomes the uploader hint.
 */
const optionalImage = (hint: string) => z.union([z.literal(""), mediaId]).describe(hint);

/** One side of the closing owner/guest dual-CTA band (editable copy + background). */
const ctaPanel = z.object({
  image_media_id: optionalImage(PANEL_IMG_HINT),
  eyebrow: tStr({ max: 60 }),
  title: tStr({ max: 160 }),
  body: tStr({ max: 400 }),
  cta_label: tStr({ max: 60 }),
});

export const homeSchema = z.object({
  hero: z.object({
    video_media_id: mediaId,
    headline: tStr({ max: 160 }),
    subtitle: tStrOpt({ max: 280 }),
    cta_primary: cta,
    cta_secondary: cta,
  }),
  owners_pitch: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 6),
    cta_primary: ctaWithNote,
    cta_secondary: ctaWithNote,
  }),
  guests_pitch: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    image_media_id: optionalImage(GUESTS_IMG_HINT),
    cta: ctaWithNote,
  }),
  // Closing band: two image panels (owner / guest) with editable copy + CTA labels.
  dual_cta: z.object({
    owner: ctaPanel,
    guest: ctaPanel,
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type HomeContent = z.infer<typeof homeSchema>;
