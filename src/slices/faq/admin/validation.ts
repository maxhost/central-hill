/**
 * Admin **save** schema for slice `faq` (S12). A group is edited together with its
 * items (one editor screen), mirroring the per-building FAQ editor: items ride along
 * as an array, each `id?` (present ⇒ update, preserving its translations; absent ⇒
 * insert), with `min(1)` on the required [T] question/answer.
 */
import { z } from "zod";
import { contentStatus, position, slug, tStr } from "@core/validation/primitives";

/** A FAQ item as the editor posts it; `id` present ⇒ update, absent ⇒ insert. */
export const faqItemForm = z.object({
  id: z.uuid().optional(),
  status: contentStatus,
  question: tStr({ min: 1, max: 300 }),
  answer: tStr({ min: 1, max: 2000 }),
});

export const faqGroupSaveInput = z.object({
  id: z.uuid().optional(),
  /** Language-neutral key binding the set to a page (owners|real_estate|guest|…). */
  key: slug,
  position,
  items: z.array(faqItemForm),
});

export type FaqGroupSaveInput = z.infer<typeof faqGroupSaveInput>;
