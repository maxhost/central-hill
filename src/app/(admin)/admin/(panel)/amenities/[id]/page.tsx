import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getAmenityForEdit } from "@slices/buildings/admin/queries";
import { AmenityForm } from "@slices/buildings/admin/ui/amenity-form";

/** Edit-amenity route (`/admin/amenities/[id]`). Gated by `(panel)`. */
export default async function EditAmenityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const data = await getAmenityForEdit(id);
  if (!data) notFound();
  return <AmenityForm initial={data} />;
}
