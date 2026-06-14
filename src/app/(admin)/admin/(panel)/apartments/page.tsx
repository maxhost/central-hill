import { requireStaff } from "@core/auth";
import { ApartmentsAdminList } from "@slices/apartments/admin/ui/list";

/** Apartments list route (`/admin/apartments`). Gated by `(panel)`. */
export default async function ApartmentsPage() {
  await requireStaff();
  return <ApartmentsAdminList />;
}
