import { requireStaff } from "@core/auth";
import { ServiceCategoryForm } from "@slices/services/admin/ui/category-form";

/** New-service-category route (`/admin/service-categories/new`). Gated by `(panel)`. */
export default async function NewServiceCategoryPage() {
  await requireStaff();
  return <ServiceCategoryForm initial={null} />;
}
