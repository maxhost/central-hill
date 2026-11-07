import "server-only";
/** Quote authoring belongs to the testimonial ficha; existing rows remain intact. */
export const isTestimonialEditorialEntity = (type: string): boolean => type === "testimonial";
export function getTestimonialEditorialRedirect(type: string, id: string): string | null {
  return isTestimonialEditorialEntity(type) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? `/admin/testimonials/${id}` : null;
}
