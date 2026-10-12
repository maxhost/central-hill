import { requireStaff } from "@core/auth";
import { ApartmentsAdminList } from "@slices/apartments/admin/ui/list";

/**
 * Apartments tab of the building workspace (`/admin/buildings/[id]/apartments`).
 * Gated by `(panel)`; the header and tabs come from the `[id]` layout, which has
 * already 404'd an unknown building.
 */
export default async function BuildingApartmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  return <ApartmentsAdminList buildingId={id} />;
}
