/**
 * Slice `faq` — input validation (grouped marketing-page FAQs).
 * Distinct from `building_faq` (per-building, owned by `buildings`).
 * See docs/data-model.md → Slice faq.
 */
import { z } from "zod";
import { contentStatus, position, slug, tStr } from "@core/validation/primitives";

/** Group key binds an FAQ set to a marketing page (owners|real_estate|guest|…). */
export const faqGroupInput = z.object({
  key: slug,
  position,
});
export type FaqGroupInput = z.infer<typeof faqGroupInput>;

export const faqItemInput = z.object({
  group_id: z.uuid(),
  position,
  status: contentStatus,
  // [T]
  question: tStr({ max: 300 }),
  answer: tStr({ max: 2000 }),
});
export type FaqItemInput = z.infer<typeof faqItemInput>;
