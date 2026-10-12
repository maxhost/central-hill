import { requireStaff } from "@core/auth";
import { ApartmentForm } from "@slices/apartments/admin/ui/apartment-form";

/**
 * New-apartment route inside the building workspace
 * (`/admin/buildings/[id]/apartments/new`, spec building-detail-admin-editor S2). The
 * building is fixed by the URL; the `[id]` layout has already 404'd an unknown one.
 * Gated by `(panel)`.
 */
export default async function NewBuildingApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  return <ApartmentForm initial={null} previews={{}} buildingId={id} />;
}
