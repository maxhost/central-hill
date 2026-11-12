import { listHeaderContactFormOptions } from "@slices/forms/server-contract";
import { requireStaff } from "@core/auth";
import { getGlobalsForEdit } from "@slices/settings/admin/queries";
import { GlobalsForm } from "@slices/settings/admin/ui/globals-form";

/** Company-globals editor route (`/admin/settings`). Admin-only, gated by `(panel)`. */
export default async function SettingsPage() {
  await requireStaff(["admin"]);
  const [bundle, options] = await Promise.all([getGlobalsForEdit(), listHeaderContactFormOptions()]);
  return <GlobalsForm initial={bundle.data} previews={bundle.previews} headerFormOptions={options} />;
}
