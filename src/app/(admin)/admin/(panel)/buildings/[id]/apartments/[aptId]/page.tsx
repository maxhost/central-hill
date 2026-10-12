import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getApartmentForEdit } from "@slices/apartments/admin/queries";
import { ApartmentForm } from "@slices/apartments/admin/ui/apartment-form";

/**
 * Edit-apartment route inside the building workspace
 * (`/admin/buildings/[id]/apartments/[aptId]`, spec building-detail-admin-editor S2).
 * 404 when the apartment does not exist or belongs to another building. Gated by
 * `(panel)`.
 */
export default async function EditBuildingApartmentPage({
  params,
}: {
  params: Promise<{ id: string; aptId: string }>;
}) {
  await requireStaff();
  const { id, aptId } = await params;
  const bundle = await getApartmentForEdit(aptId);
  if (!bundle || bundle.data.building_id !== id) notFound();
  return <ApartmentForm initial={bundle.data} previews={bundle.previews} buildingId={id} />;
}
