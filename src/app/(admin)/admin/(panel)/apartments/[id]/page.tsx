import { notFound, redirect } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getApartmentForEdit } from "@slices/apartments/admin/queries";

/**
 * Legacy edit-apartment route (`/admin/apartments/[id]`): redirects to the nested
 * route inside the apartment's building (spec building-detail-admin-editor), 404 when
 * the apartment does not exist. Gated by `(panel)`.
 */
export default async function EditApartmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const bundle = await getApartmentForEdit(id);
  if (!bundle) notFound();
  redirect(`/admin/buildings/${bundle.data.building_id}/apartments/${id}`);
}
