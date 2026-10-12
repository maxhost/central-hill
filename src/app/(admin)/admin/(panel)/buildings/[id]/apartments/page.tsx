import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { ApartmentsAdminList } from "@slices/apartments/admin/ui/list";
import { getBuildingWorkspace } from "@slices/buildings/admin/queries";

/**
 * Apartments tab of the building workspace (`/admin/buildings/[id]/apartments`).
 * Gated by `(panel)`; the header and tabs come from the `[id]` layout. The building's
 * status (for the "none published" warning) is read from the buildings slice here
 * and handed to the apartments list by prop — the apartments slice never reads
 * buildings internals.
 */
export default async function BuildingApartmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const workspace = await getBuildingWorkspace(id);
  if (!workspace) notFound();
  return <ApartmentsAdminList buildingId={id} buildingStatus={workspace.status} />;
}
