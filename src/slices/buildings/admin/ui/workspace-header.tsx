import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StateBadge } from "@slices/backoffice/contract";
import type { BuildingWorkspace } from "../queries";
import { BuildingWorkspaceTabs } from "./workspace-tabs";

/**
 * Header of the building workspace (`/admin/buildings/[id]` layout — spec
 * building-detail-admin-editor, S1): "← Buildings", the building name, its status,
 * "View on site ↗" when published, and the Building / Apartments (N) tabs. The
 * apartment count comes in as a prop: the route composes it from the apartments
 * slice, so `buildings` never reads apartments.
 */

const STATUS_TONE: Record<BuildingWorkspace["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function BuildingWorkspaceHeader({
  workspace,
  apartmentsCount,
}: {
  workspace: BuildingWorkspace;
  apartmentsCount: number;
}) {
  const t = await getTranslations("buildings");

  return (
    <div className="space-y-4 border-b border-line">
      <Link href="/admin/buildings" className="text-sm text-ink-soft hover:text-ink">
        ← {t("admin.workspace.backToBuildings")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl leading-tight text-ink">{workspace.name}</h1>
          <StateBadge
            label={t(`admin.status.${workspace.status}`)}
            tone={STATUS_TONE[workspace.status]}
          />
        </div>
        {workspace.status === "published" ? (
          <a
            href={workspace.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-soft hover:text-accent-deep"
          >
            {t("admin.workspace.viewOnSite")} ↗
          </a>
        ) : null}
      </div>
      <BuildingWorkspaceTabs
        buildingId={workspace.id}
        buildingLabel={t("admin.workspace.tabBuilding")}
        apartmentsLabel={t("admin.workspace.tabApartments", { count: apartmentsCount })}
        ariaLabel={t("admin.workspace.tabsLabel")}
      />
    </div>
  );
}
