import { requireStaff } from "@core/auth";
import { Dashboard } from "@slices/backoffice/contract";

/** Backoffice home (`/admin`) — the dashboard. */
export default async function AdminHomePage() {
  const staff = await requireStaff();
  return <Dashboard staff={staff} />;
}
