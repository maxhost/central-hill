/**
 * `guides` page content schema (ADR 0012). Source-locale values only.
 *
 * Holds the guides copy that is not a guide: today, the accommodation CTA at the bottom of every
 * guide's sticky aside ("In this guide" card, `mock/guide-detail.html` `.aside-cta`). Its
 * destination is fixed in code (the visitor's locale `/buildings`), so only the photo and the
 * copy are editable. A blank photo shows `GUIDE_ASIDE_FALLBACK_IMAGE`.
 *
 * `defaultGuides` is the approved mock copy, minus the beach-only title (the CTA is shared by
 * every guide): the seed, the migration that creates the row and the renderer fallback.
 */
import { z } from "zod";
import { seoShape, tStr, tStrOpt } from "@core/validation/primitives";
import { optionalIconKey, optionalImage, optionalVideo } from "./_shared";

const ASIDE_IMG_HINT =
  "Apartment photo above the text. Landscape 16:10 — recommended 760×475px, JPG or WebP, under 300 KB.";

/** Only the {city} token is allowed; names remain localized Geography data. */
export function validGuideCityHeadline(value: string): boolean {
  return !value.trim() || (value.includes("{city}") && !value.replaceAll("{city}", "").match(/[{}]/));
}
const cityHeadline = tStrOpt({ max: 200 }).refine(
  (value) => value === undefined || validGuideCityHeadline(value),
  "Include {city} and no other placeholders.",
);
const copy = {
  eyebrow: tStrOpt({ max: 80 }),
  headline: tStrOpt({ max: 200 }),
  body: tStrOpt({ max: 1200 }),
};

export const guidesSchema = z.object({
  seo: z.object({ ...seoShape }).optional(),
  hero: z.object({
    ...copy,
    video_media_id: optionalVideo("Optional silent MP4/WebM, landscape 1920×1080, ideally under 15 MB.").optional(),
    poster_media_id: optionalImage("Background photo and video poster. Landscape 1920×1080, JPEG/WebP/AVIF, ideally under 500 KB.").optional(),
  }).optional(),
  city_filter: z.object({
    enabled: z.boolean().optional(),
    label: tStrOpt({ max: 80 }),
    note: tStrOpt({ max: 240 }),
    soon_label: tStrOpt({ max: 60 }),
    location_icon_key: optionalIconKey,
  }).optional(),
  catalogue: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: cityHeadline,
    view_label: tStrOpt({ max: 80 }),
    empty_message: tStrOpt({ max: 400 }),
    template_icons: z.object({
      landing_icon_key: optionalIconKey, eat_icon_key: optionalIconKey,
      beaches_icon_key: optionalIconKey, events_icon_key: optionalIconKey,
      secrets_icon_key: optionalIconKey, families_icon_key: optionalIconKey,
      groups_icon_key: optionalIconKey, travellers_icon_key: optionalIconKey,
      custom_icon_key: optionalIconKey,
    }).optional(),
  }).optional(),
  recommendations: z.object({
    ...copy,
    restaurant_label: tStrOpt({ max: 80 }),
    viewpoint_label: tStrOpt({ max: 80 }),
    beach_label: tStrOpt({ max: 80 }),
    location_icon_key: optionalIconKey,
  }).optional(),
  final_cta: z.object({ ...copy, cta_label: tStrOpt({ max: 80 }) }).optional(),
  guide_aside: z
    .object({
      image_media_id: optionalImage(ASIDE_IMG_HINT),
      eyebrow: tStrOpt({ max: 80 }),
      title: tStr({ max: 120 }),
      body: tStrOpt({ max: 280 }),
      cta_label: tStr({ max: 60 }),
    })
    .describe("Call to action under the table of contents of every guide. The button goes to the Buildings page."),
});
export type GuidesContent = z.infer<typeof guidesSchema>;

export const defaultGuides: GuidesContent = {
  guide_aside: {
    image_media_id: "",
    eyebrow: "Stay in Lisbon",
    title: "Your base for exploring",
    body: "Furnished apartments in Bairro Alto and Chiado, close to everything in this guide.",
    cta_label: "Browse apartments →",
  },
};

/** The mock's apartment photo, shown while `guide_aside.image_media_id` is blank. */
export const GUIDE_ASIDE_FALLBACK_IMAGE = {
  url: "https://pub-9abd9259e8d44b439c0d61c790223db5.r2.dev/3624d279-e8e8-4ea0-ab9d-a62c632fda66/1.jpg",
  alt: "A furnished Central Hill apartment in Lisbon",
} as const;
