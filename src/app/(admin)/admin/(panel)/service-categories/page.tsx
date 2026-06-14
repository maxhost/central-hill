import { requireStaff } from "@core/auth";
import { ServiceCategoriesAdminList } from "@slices/services/admin/ui/category-list";

/** Service-categories list route (`/admin/service-categories`). Gated by `(panel)`. */
export default async function ServiceCategoriesPage() {
  await requireStaff();
  return <ServiceCategoriesAdminList />;
}
