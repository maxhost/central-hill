import { requireStaff } from "@core/auth";
import { FaqAdminList } from "@slices/faq/admin/ui/list";

/** FAQ groups list route (`/admin/faq`). Gated by `(panel)`. */
export default async function FaqPage() {
  await requireStaff();
  return <FaqAdminList />;
}
