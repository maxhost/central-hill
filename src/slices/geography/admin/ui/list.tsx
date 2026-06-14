import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  StateBadge,
} from "@slices/backoffice/contract";
import { type CityAdminListItem, listCitiesAdmin } from "../queries";

/**
 * Geography backoffice list (S12) at `/admin/cities`. Server component: lists every
 * city (all statuses) with its neighbourhood count, links each to its editor, and
 * offers a "new city" action. Strings come from the `geography` namespace.
 */

const STATUS_TONE: Record<CityAdminListItem["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function CitiesAdminList() {
  const t = await getTranslations("geography");
  const rows = await listCitiesAdmin();

  const columns: Column<CityAdminListItem>[] = [
    {
      header: t("admin.columns.name"),
      cell: (row) => (
        <Link href={`/admin/cities/${row.id}`} className="font-medium text-ink hover:text-accent-deep">
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
      header: t("admin.columns.country"),
      cell: (row) => <span className="text-ink-soft">{row.country}</span>,
      className: "hidden md:table-cell",
    },
    {
      header: t("admin.columns.neighbourhoods"),
      cell: (row) => <span className="text-ink-soft">{row.neighbourhoods}</span>,
      className: "hidden sm:table-cell",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.title")}
        description={t("admin.subtitle")}
        actions={
          <Link
            href="/admin/cities/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.newCity")}
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
