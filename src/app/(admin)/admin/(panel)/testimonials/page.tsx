import { requireStaff } from "@core/auth";
import { TestimonialsAdminList } from "@slices/testimonials/admin/ui/list";

/** Testimonials list route (`/admin/testimonials`). Gated by `(panel)`. */
export default async function TestimonialsPage() {
  await requireStaff();
  return <TestimonialsAdminList />;
}
