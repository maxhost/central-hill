/**
 * Slice `testimonials` — input validation. Audience-tagged; shared by Home/Owners/Guests.
 * See docs/data-model.md → Slice testimonials.
 */
import { z } from "zod";
import { contentStatus, position, tStr } from "@core/validation/primitives";

export const testimonialInput = z.object({
  audience: z.enum(["owner", "guest"]),
  rating: z.number().int().min(1).max(5),
  author_name: z.string().min(1).max(120),
  author_country: z.string().min(1).max(80),
  property_location: z.string().max(120).optional(),
  position,
  status: contentStatus,
  // [T]
  quote: tStr({ max: 1000 }),
});
export type TestimonialInput = z.infer<typeof testimonialInput>;
