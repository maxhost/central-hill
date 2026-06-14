import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  StateBadge,
} from "@slices/backoffice/contract";
import { type ApartmentAdminListItem, listApartmentsAdmin } from "../queries";

/**
 * Apartments backoffice list (S12) at `/admin/apartments`. Server component, all
 * statuses, grouped visually by building (rows ordered by building then position).
 */

const STATUS_TONE: Record<ApartmentAdminListItem["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function ApartmentsAdminList() {
  const t = await getTranslations("apartments");
  const rows = await listApartmentsAdmin();

  const columns: Column<ApartmentAdminListItem>[] = [
    {
      header: t("admin.columns.name"),
      cell: (row) => (
        <Link
          href={`/admin/apartments/${row.id}`}
          className="font-medium text-ink hover:text-accent-deep"
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: t("admin.columns.building"),
      cell: (row) => <span className="text-ink-soft">{row.building}</span>,
    },
    {
      header: t("admin.columns.status"),
      cell: (row) => (
        <StateBadge label={t(`admin.status.${row.status}`)} tone={STATUS_TONE[row.status]} />
      ),
    },
    {
      header: t("admin.columns.bedrooms"),
      cell: (row) => <span className="text-ink-soft">{row.bedrooms}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: t("admin.columns.guests"),
      cell: (row) => <span className="text-ink-soft">{row.maxGuests}</span>,
      className: "hidden md:table-cell",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.title")}
        description={t("admin.subtitle")}
        actions={
          <Link
            href="/admin/apartments/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.newApartment")}
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
