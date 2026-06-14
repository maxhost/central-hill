import { requireStaff } from "@core/auth";
import { BuildingsAdminList } from "@slices/buildings/admin/ui/list";

/** Buildings list route (`/admin/buildings`). Gated by `(panel)`. */
export default async function BuildingsPage() {
  await requireStaff();
  return <BuildingsAdminList />;
}
