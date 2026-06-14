import { requireStaff } from "@core/auth";
import { CityForm } from "@slices/geography/admin/ui/city-form";

/** New-city route (`/admin/cities/new`). Gated by `(panel)`. */
export default async function NewCityPage() {
  await requireStaff();
  return <CityForm initial={null} previews={{}} />;
}
