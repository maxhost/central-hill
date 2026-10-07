import { requireStaff } from "@core/auth";
import { AmenitiesAdminList } from "@slices/buildings/admin/ui/amenity-list";

/** Amenity taxonomy list route (`/admin/amenities`). Gated by `(panel)`. */
export default async function AmenitiesPage() {
  await requireStaff();
  return <AmenitiesAdminList />;
}
