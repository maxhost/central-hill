import { requireStaff } from "@core/auth";
import { PagesAdminList } from "@slices/pages/admin/ui/list";

/** Pages list route (`/admin/pages`). Gated by `(panel)`. */
export default async function PagesPage() {
  await requireStaff();
  return <PagesAdminList />;
}
