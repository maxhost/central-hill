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
import { ApartmentMoveButtons } from "./move-buttons";

/**
 * Apartments backoffice list (S12). Server component, all statuses.
 *
 * With `buildingId` it is the building workspace's Apartments tab
 * (`/admin/buildings/[id]/apartments`, spec building-detail-admin-editor S2): that
 * building's rows in display order with Order (↑ / ↓ → `moveApartment`), Photo,
 * Name (+ badge), Status, Specs and Avantio columns, no page header (the workspace
 * layout provides it), and a warning while the building is published but none of its
 * apartments is. `buildingStatus` comes from the route (buildings slice) by prop.
 *
 * Without `buildingId` it is the legacy all-apartments table (no route mounts it
 * since `/admin/apartments` redirects to `/admin/buildings`); its links point at the
 * nested routes.
 */

const STATUS_TONE: Record<
  ApartmentAdminListItem["status"],
  "approved" | "draft" | "neutral"
> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

const PLACEHOLDER = "/placeholders/apartment.svg";

const editHref = (row: ApartmentAdminListItem) =>
  `/admin/buildings/${row.buildingId}/apartments/${row.id}`;

export async function ApartmentsAdminList({
  buildingId,
  buildingStatus,
}: {
  buildingId?: string;
  buildingStatus?: "draft" | "published" | "archived";
} = {}) {
  const t = await getTranslations("apartments");
  const rows = await listApartmentsAdmin({ buildingId });

  const specs = (row: ApartmentAdminListItem) =>
    [
      t("admin.specs.bedrooms", { count: row.bedrooms }),
      t("admin.specs.beds", { count: row.bedsCount }),
      t("admin.specs.guests", { count: row.maxGuests }),
      ...(row.sizeM2 != null ? [t("admin.specs.size", { size: row.sizeM2 })] : []),
    ].join(" · ");

  const nameColumn: Column<ApartmentAdminListItem> = {
    header: t("admin.columns.name"),
    cell: (row) => (
      <div className="flex flex-wrap items-center gap-2">
        <Link href={editHref(row)} className="font-medium text-ink hover:text-accent-deep">
          {row.name}
        </Link>
        {row.badge ? <StateBadge label={row.badge} tone="accent" /> : null}
      </div>
    ),
  };
  const statusColumn: Column<ApartmentAdminListItem> = {
    header: t("admin.columns.status"),
    cell: (row) => (
      <StateBadge label={t(`admin.status.${row.status}`)} tone={STATUS_TONE[row.status]} />
    ),
  };

  const columns: Column<ApartmentAdminListItem>[] = buildingId
    ? [
        {
          header: t("admin.columns.order"),
          cell: (row) => {
            const index = rows.indexOf(row);
            return (
              <ApartmentMoveButtons
                id={row.id}
                canUp={index > 0}
                canDown={index < rows.length - 1}
              />
            );
          },
          className: "w-0",
        },
        {
          header: t("admin.columns.photo"),
          cell: (row) => (
            <div className="h-12 w-16 overflow-hidden rounded bg-line/60">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, not public render path */}
              <img
                src={row.cover?.url ?? PLACEHOLDER}
                alt={row.cover ? "" : t("admin.noPhoto")}
                className={row.cover ? "h-full w-full object-cover" : "h-full w-full object-contain p-2"}
              />
            </div>
          ),
          className: "hidden sm:table-cell",
        },
        nameColumn,
        statusColumn,
        {
          header: t("admin.columns.specs"),
          cell: (row) => <span className="whitespace-nowrap text-ink-soft">{specs(row)}</span>,
          className: "hidden md:table-cell",
        },
        {
          header: t("admin.columns.avantio"),
          cell: (row) =>
            row.hasAvantioUrl ? (
              <span className="text-emerald-700" title={t("admin.avantio.own")}>
                ✓<span className="sr-only">{t("admin.avantio.own")}</span>
              </span>
            ) : (
              <span className="text-ink-soft">{t("admin.avantio.usesBuilding")}</span>
            ),
          className: "hidden lg:table-cell",
        },
      ]
    : [
        nameColumn,
        {
          header: t("admin.columns.building"),
          cell: (row) => <span className="text-ink-soft">{row.building}</span>,
        },
        statusColumn,
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
      href={buildingId ? `/admin/buildings/${buildingId}/apartments/new` : "/admin/buildings"}
      className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
    >
      + {t("admin.newApartment")}
    </Link>
  );

  if (!buildingId) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={t("admin.title")}
          description={t("admin.subtitle")}
          actions={newButton}
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

  // The public "Apartments in this Building" grid renders published units only, so a
  // published building with none (or no apartments at all) shows no such section.
  const noneVisible =
    buildingStatus === "published" && !rows.some((row) => row.status === "published");

  return (
    <div className="space-y-6">
      {rows.length > 0 ? <div className="flex justify-end">{newButton}</div> : null}
      {noneVisible ? (
        <p
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {t.rich("admin.noPublishedWarning", { em: (chunks) => <em>{chunks}</em> })}
        </p>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={
          <div className="space-y-4">
            <EmptyState
              title={t("admin.buildingEmpty")}
              hint={t("admin.buildingEmptyHint")}
            />
            <div className="flex justify-center">{newButton}</div>
          </div>
        }
      />
    </div>
  );
}
