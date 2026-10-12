import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { countApartmentsByBuilding } from "@slices/apartments/admin/queries";
import { getBuildingWorkspace } from "@slices/buildings/admin/queries";
import { BuildingWorkspaceHeader } from "@slices/buildings/admin/ui/workspace-header";

/**
 * Building workspace (`/admin/buildings/[id]/…`, spec building-detail-admin-editor
 * S1): a shared header with the building's name, status and "View on site", plus
 * the Building / Apartments tabs, around every nested route. Composes the
 * apartment count from the apartments slice and hands it to the buildings header
 * by prop. Gated by `(panel)`; `requireStaff` again since layouts render
 * independently of their pages.
 */
export default async function BuildingWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const [workspace, counts] = await Promise.all([
    getBuildingWorkspace(id),
    countApartmentsByBuilding(),
  ]);
  if (!workspace) notFound();

  return (
    <div className="space-y-6">
      <BuildingWorkspaceHeader
        workspace={workspace}
        apartmentsCount={counts.get(id)?.total ?? 0}
      />
      {children}
    </div>
  );
}
