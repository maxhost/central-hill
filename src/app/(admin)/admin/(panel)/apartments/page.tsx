import { redirect } from "next/navigation";
import { requireStaff } from "@core/auth";

/**
 * Legacy apartments list (`/admin/apartments`). Apartments are managed inside their
 * building since spec building-detail-admin-editor (D4), so this redirects to the
 * buildings list. Gated by `(panel)`.
 */
export default async function ApartmentsPage() {
  await requireStaff();
  redirect("/admin/buildings");
}
