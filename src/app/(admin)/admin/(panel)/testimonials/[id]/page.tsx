import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getTestimonialForEdit } from "@slices/testimonials/admin/queries";
import { TestimonialForm } from "@slices/testimonials/admin/ui/testimonial-form";

/** Edit-testimonial route (`/admin/testimonials/[id]`). Gated by `(panel)`. */
export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const data = await getTestimonialForEdit(id);
  if (!data) notFound();
  return <TestimonialForm initial={data} />;
}
