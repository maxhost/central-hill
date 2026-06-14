/**
 * Admin **save** schema for slice `testimonials` (S12). Mirrors the public
 * `testimonialInput` but in the editor's post shape: `id?` (present ⇒ update),
 * `property_location` nullable (the client posts `null` for an empty control), and
 * the required [T] `quote` gets a `min(1)` so a testimonial can't be saved blank.
 */
import { z } from "zod";
import { contentStatus, position, tStr } from "@core/validation/primitives";

export const testimonialSaveInput = z.object({
  id: z.uuid().optional(),
  audience: z.enum(["owner", "guest"]),
  rating: z.number().int().min(1).max(5),
  author_name: z.string().min(1).max(120),
  author_country: z.string().min(1).max(80),
  property_location: z.string().max(120).nullable(),
  position,
  status: contentStatus,
  // [T] source value (en):
  quote: tStr({ min: 1, max: 1000 }),
});

export type TestimonialSaveInput = z.infer<typeof testimonialSaveInput>;
