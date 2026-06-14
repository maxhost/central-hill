/**
 * Slice `media` (kernel-adjacent) — input validation for `media_asset`.
 * R2-backed; videos are referenced the same way (player chosen by mime in UI).
 * See docs/data-model.md → Slice media.
 */
import { z } from "zod";
import { tStr } from "@core/validation/primitives";

export const mediaAssetInput = z.object({
  r2_key: z.string().min(1).max(400),
  mime: z.string().min(1).max(100),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurhash: z.string().max(100).optional(),
  credit: z.string().max(200).optional(),
  // [T]
  alt: tStr({ max: 300 }),
});
export type MediaAssetInput = z.infer<typeof mediaAssetInput>;
