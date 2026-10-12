import { redirect } from "next/navigation";
import { requireStaff } from "@core/auth";

/**
 * Legacy new-apartment route (`/admin/apartments/new`). A new apartment is created
 * inside its building (spec building-detail-admin-editor), so this redirects to the
 * buildings list to pick one. Gated by `(panel)`.
 */
export default async function NewApartmentPage() {
  await requireStaff();
  redirect("/admin/buildings");
}
