import { requireStaff } from "@core/auth";
import { ApartmentForm } from "@slices/apartments/admin/ui/apartment-form";
import { listBuildingOptions } from "@slices/buildings/contract";

/** New-apartment route (`/admin/apartments/new`). Gated by `(panel)`. */
export default async function NewApartmentPage() {
  await requireStaff();
  const buildings = await listBuildingOptions();
  return <ApartmentForm initial={null} previews={{}} buildings={buildings} />;
}
