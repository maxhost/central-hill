import { requireStaff } from "@core/auth";
import { TestimonialForm } from "@slices/testimonials/admin/ui/testimonial-form";

/** New-testimonial route (`/admin/testimonials/new`). Gated by `(panel)`. */
export default async function NewTestimonialPage() {
  await requireStaff();
  return <TestimonialForm initial={null} />;
}
