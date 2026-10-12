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
 * With `buildingId` it is the building workspace's Apartments tab
 * (`/admin/buildings/[id]/apartments`, spec building-detail-admin-editor S1): only
 * that building's rows, no Building column, and no page header (the workspace
 * layout provides it). Row and "new" links still target `/admin/apartments/…`
 * until S2 nests them.
 */

const STATUS_TONE: Record<
  ApartmentAdminListItem["status"],
  "approved" | "draft" | "neutral"
> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function ApartmentsAdminList({ buildingId }: { buildingId?: string } = {}) {
  const t = await getTranslations("apartments");
  const rows = await listApartmentsAdmin({ buildingId });

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
    ...(buildingId
      ? []
      : [
          {
            header: t("admin.columns.building"),
            cell: (row: ApartmentAdminListItem) => (
              <span className="text-ink-soft">{row.building}</span>
            ),
          },
        ]),
    {
      header: t("admin.columns.status"),
      cell: (row) => (
        <StateBadge
          label={t(`admin.status.${row.status}`)}
          tone={STATUS_TONE[row.status]}
        />
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

  const newButton = (
    <Link
      href="/admin/apartments/new"
      className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
    >
      {t("admin.newApartment")}
    </Link>
  );

  return (
    <div className="space-y-6">
      {buildingId ? (
        <div className="flex justify-end">{newButton}</div>
      ) : (
        <AdminPageHeader
          title={t("admin.title")}
          description={t("admin.subtitle")}
          actions={newButton}
        />
      )}
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={
          buildingId ? (
            <EmptyState
              title={t("admin.buildingEmpty")}
              hint={t("admin.buildingEmptyHint")}
            />
          ) : (
            <EmptyState title={t("admin.empty")} hint={t("admin.emptyHint")} />
          )
        }
      />
    </div>
  );
}
