import { requireStaff } from "@core/auth";
import { getNavigationForEdit } from "@slices/settings/admin/queries";
import { NavForm } from "@slices/settings/admin/ui/nav-form";

/** Navigation builder route (`/admin/navigation`). Admin-only, gated by `(panel)`. */
export default async function NavigationPage() {
  await requireStaff(["admin"]);
  const data = await getNavigationForEdit();
  return <NavForm initial={data} />;
}
