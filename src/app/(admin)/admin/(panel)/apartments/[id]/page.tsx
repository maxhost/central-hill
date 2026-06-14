import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getApartmentForEdit } from "@slices/apartments/admin/queries";
import { ApartmentForm } from "@slices/apartments/admin/ui/apartment-form";
import { listBuildingOptions } from "@slices/buildings/contract";

/** Edit-apartment route (`/admin/apartments/[id]`). Gated by `(panel)`. */
export default async function EditApartmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const [bundle, buildings] = await Promise.all([getApartmentForEdit(id), listBuildingOptions()]);
  if (!bundle) notFound();
  return <ApartmentForm initial={bundle.data} previews={bundle.previews} buildings={buildings} />;
}
