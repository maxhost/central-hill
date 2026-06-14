import "server-only";
import { updateTag } from "@core/revalidate";
import { TESTIMONIAL_TAGS } from "../contract";

/**
 * Single place that busts the testimonials ISR cache on publish (conventions.md →
 * "don't scatter revalidateTag calls"). The testimonials admin actions (S12) call
 * this after a successful persist + translation enqueue.
 *
 * Testimonials have no routes of their own — they are embedded by S9 pages, whose
 * cached reads also subscribe to `TESTIMONIAL_TAGS.list`, so busting it here cascades
 * the refresh of every page that renders a testimonial row.
 */
export function revalidateTestimonials(): void {
  updateTag(TESTIMONIAL_TAGS.list);
}
