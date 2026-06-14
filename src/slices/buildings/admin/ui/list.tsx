import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  StateBadge,
} from "@slices/backoffice/contract";
import { type BuildingAdminListItem, listBuildingsAdmin } from "../queries";

/**
 * Buildings backoffice list (S12) at `/admin/buildings`. Server component: reads
 * every status live (admin is dynamic, no ISR), links each row to its editor, and
 * offers a "new building" action. Strings come from the `buildings` namespace.
 */

const STATUS_TONE: Record<BuildingAdminListItem["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function BuildingsAdminList() {
  const t = await getTranslations("buildings");
  const rows = await listBuildingsAdmin();

  const columns: Column<BuildingAdminListItem>[] = [
    {
      header: t("admin.columns.name"),
      cell: (row) => (
        <Link
          href={`/admin/buildings/${row.id}`}
          className="font-medium text-ink hover:text-accent-deep"
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: t("admin.columns.status"),
      cell: (row) => (
        <StateBadge label={t(`admin.status.${row.status}`)} tone={STATUS_TONE[row.status]} />
      ),
    },
    {
      header: t("admin.columns.city"),
      cell: (row) => <span className="text-ink-soft">{row.city}</span>,
      className: "hidden md:table-cell",
    },
    {
      header: t("admin.columns.apartments"),
      cell: (row) => <span className="text-ink-soft">{row.apartments}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: t("admin.columns.flags"),
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.isFeatured ? <StateBadge label={t("admin.featured")} tone="accent" /> : null}
          {row.isNew ? <StateBadge label={t("admin.new")} tone="review" /> : null}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.title")}
        description={t("admin.subtitle")}
        actions={
          <Link
            href="/admin/buildings/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.newBuilding")}
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={<EmptyState title={t("admin.empty")} hint={t("admin.emptyHint")} />}
      />
    </div>
  );
}
