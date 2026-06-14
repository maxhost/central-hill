/**
 * Public contract of slice `testimonials` (the ONLY surface other slices may import).
 * Produces an audience-tagged read model + cache tag (docs/vertical-slices.md → S7).
 * Has no public routes of its own — it is embedded by S9 pages (Home/Owners/Guests).
 * Consumers: S9 pages (testimonial rows), S14 translation (the `quote` [T] field).
 */

/** Entity type used for translation keys and cache tags. */
export const TESTIMONIAL = "testimonial" as const;

/** Cache tags this slice owns (conventions.md → Cache tags). */
export const TESTIMONIAL_TAGS = {
  list: "testimonial-list",
} as const;

/** Which marketing audience a testimonial speaks to. */
export type TestimonialAudience = "owner" | "guest";

export interface Testimonial {
  id: string;
  audience: TestimonialAudience;
  /** 1–5; rendered as stars. */
  rating: number;
  /** Resolved [T] quote (approved target locale, else source `en`). */
  quote: string;
  authorName: string;
  authorCountry: string;
  /** e.g. "Príncipe Real, Lisbon" — optional. */
  propertyLocation: string | null;
}

export { listTestimonials } from "./server/queries";

/**
 * Backoffice contribution (S12). `testimonialsAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout; the list + create/edit form mount
 * under `app/(admin)/admin/(panel)/testimonials/…`. Pure data — safe to import anywhere.
 */
export { testimonialsAdminScreens } from "./admin/screens";
