import { requireStaff } from "@core/auth";
import { countApartmentsByBuilding } from "@slices/apartments/admin/queries";
import { BuildingsAdminList } from "@slices/buildings/admin/ui/list";

/**
 * Buildings list route (`/admin/buildings`). Gated by `(panel)`. Composes the
 * per-building apartment counts from the apartments slice into the list.
 */
export default async function BuildingsPage() {
  await requireStaff();
  const apartmentCounts = await countApartmentsByBuilding();
  return <BuildingsAdminList apartmentCounts={apartmentCounts} />;
}
