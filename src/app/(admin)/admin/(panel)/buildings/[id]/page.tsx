import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import {
  getBuildingForEdit,
  listAmenitiesAdmin,
  listLocationOptions,
} from "@slices/buildings/admin/queries";
import { BuildingForm } from "@slices/buildings/admin/ui/building-form";

/**
 * Edit-building route (`/admin/buildings/[id]`), the "Building" tab of the workspace.
 * Gated by `(panel)`; the header and tabs come from the sibling `layout.tsx`.
 */
export default async function EditBuildingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const [bundle, amenities, locations] = await Promise.all([
    getBuildingForEdit(id),
    listAmenitiesAdmin(),
    listLocationOptions(),
  ]);
  if (!bundle) notFound();
  return (
    <BuildingForm
      variant="workspace"
      initial={bundle.data}
      previews={bundle.previews}
      amenities={amenities}
      locations={locations}
    />
  );
}
