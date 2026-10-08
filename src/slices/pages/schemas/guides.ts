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
import { tStr, tStrOpt } from "@core/validation/primitives";
import { optionalImage } from "./_shared";

const ASIDE_IMG_HINT =
  "Apartment photo above the text. Landscape 16:10 — recommended 760×475px, JPG or WebP, under 300 KB.";

export const guidesSchema = z.object({
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
