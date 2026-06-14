import { requireStaff } from "@core/auth";
import { listAmenitiesAdmin, listLocationOptions } from "@slices/buildings/admin/queries";
import { BuildingForm } from "@slices/buildings/admin/ui/building-form";

/** New-building route (`/admin/buildings/new`). Gated by `(panel)`. */
export default async function NewBuildingPage() {
  await requireStaff();
  const [amenities, locations] = await Promise.all([listAmenitiesAdmin(), listLocationOptions()]);
  return <BuildingForm initial={null} previews={{}} amenities={amenities} locations={locations} />;
}
