/** Fixed editorial sections of the Services listing. Blank values preserve locale messages. */
import { z } from "zod";
import { seoShape, tStrOpt } from "@core/validation/primitives";
import { fixed, optionalAnimated, optionalIconKey, optionalImage } from "./_shared";

const visual = (hint: string) => ({
  media_media_id: optionalAnimated(hint).optional(),
  media_alt: tStrOpt({ max: 300 }),
  poster_media_id: optionalImage("Optional still image; also used for reduced motion.").optional(),
});
const copy = {
  eyebrow: tStrOpt({ max: 80 }),
  headline: tStrOpt({ max: 200 }),
  body: tStrOpt({ max: 1200 }),
};
export const servicesSchema = z.object({
  seo: z.object({ ...seoShape }).optional(),
  hero: z.object({
    ...copy,
    ...visual("Landscape 16:9, 1920×1080. Photo ideally under 500 KB; silent MP4 H.264 loop, 10–20 seconds, ideally under 15 MB. Animated WebP and WebM are also supported."),
  }).optional(),
  intro: z.object(copy).optional(),
  how_it_works: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStrOpt({ max: 200 }),
    items: fixed(z.object({
      icon_key: optionalIconKey,
      title: tStrOpt({ max: 160 }),
      body: tStrOpt({ max: 600 }),
    }), 3).meta({ fixed_order: true }).optional(),
  }).optional(),
  final_cta: z.object({
    ...copy,
    ...visual("Portrait 4:5, 1200×1500. Photo ideally under 500 KB; silent MP4 H.264 loop, 6–15 seconds, ideally under 10 MB; animated WebP ideally under 5 MB. WebM is also supported."),
    cta_label: tStrOpt({ max: 80 }),
    contact_note: tStrOpt({ max: 240 }),
  }).optional(),
});
export type ServicesContent = z.infer<typeof servicesSchema>;
/** Empty overrides intentionally retain the current messages in all four locales. */
export const defaultServices: ServicesContent = {};
