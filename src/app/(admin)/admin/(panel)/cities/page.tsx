import { requireStaff } from "@core/auth";
import { CitiesAdminList } from "@slices/geography/admin/ui/list";

/** Cities list route (`/admin/cities`). Gated by `(panel)`. */
export default async function CitiesPage() {
  await requireStaff();
  return <CitiesAdminList />;
}
