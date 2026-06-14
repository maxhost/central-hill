import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getCityForEdit } from "@slices/geography/admin/queries";
import { CityForm } from "@slices/geography/admin/ui/city-form";

/** Edit-city route (`/admin/cities/[id]`). Gated by `(panel)`. */
export default async function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const bundle = await getCityForEdit(id);
  if (!bundle) notFound();
  return <CityForm initial={bundle.data} previews={bundle.previews} />;
}
