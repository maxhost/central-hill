import { requireStaff } from "@core/auth";
import { ServicesAdminList } from "@slices/services/admin/ui/list";

/** Services list route (`/admin/services`). Gated by `(panel)`. */
export default async function ServicesPage() {
  await requireStaff();
  return <ServicesAdminList />;
}
