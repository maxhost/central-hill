import { requireStaff } from "@core/auth";
import { AmenityForm } from "@slices/buildings/admin/ui/amenity-form";

/** New-amenity route (`/admin/amenities/new`). Gated by `(panel)`. */
export default async function NewAmenityPage() {
  await requireStaff();
  return <AmenityForm initial={null} />;
}
