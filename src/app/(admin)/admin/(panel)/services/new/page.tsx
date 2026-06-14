import { requireStaff } from "@core/auth";
import { listServiceCategoryOptions } from "@slices/services/admin/queries";
import { ServiceForm } from "@slices/services/admin/ui/service-form";

/** New-service route (`/admin/services/new`). Gated by `(panel)`. */
export default async function NewServicePage() {
  await requireStaff();
  const categories = await listServiceCategoryOptions();
  return <ServiceForm initial={null} previews={{}} categories={categories} />;
}
