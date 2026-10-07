import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  SpriteIcon,
} from "@slices/backoffice/contract";
import { type AmenityAdminListItem, listAmenitiesForAdminTable } from "../queries";

/**
 * Amenity taxonomy backoffice list at `/admin/amenities` (mirrors the service-category
 * list). Server component. Strings come from the `buildings` namespace.
 */
export async function AmenitiesAdminList() {
  const t = await getTranslations("buildings");
  const rows = await listAmenitiesForAdminTable();

  const columns: Column<AmenityAdminListItem>[] = [
    {
      header: t("admin.amenity.columns.label"),
      cell: (row) => (
        <Link
          href={`/admin/amenities/${row.id}`}
          className="flex items-center gap-2 font-medium text-ink hover:text-accent-deep"
        >
          <SpriteIcon name={row.icon ?? "check-circle"} size={18} className="shrink-0 text-ink-soft" />
          {row.label}
        </Link>
      ),
    },
    {
      header: t("admin.amenity.columns.slug"),
      cell: (row) => <span className="text-ink-soft">{row.slug}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: t("admin.amenity.columns.icon"),
      cell: (row) => (
        <span className="text-ink-soft">{row.icon ?? t("admin.amenity.defaultIcon")}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: t("admin.amenity.columns.group"),
      cell: (row) => <span className="text-ink-soft">{row.group ?? ""}</span>,
      className: "hidden md:table-cell",
    },
    {
      header: t("admin.amenity.columns.buildings"),
      cell: (row) => <span className="text-ink-soft">{row.buildings}</span>,
      className: "hidden sm:table-cell",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.amenity.title")}
        description={t("admin.amenity.subtitle")}
        actions={
          <Link
            href="/admin/amenities/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.amenity.newAmenity")}
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={
          <EmptyState
            title={t("admin.amenity.empty")}
            hint={t("admin.amenity.emptyHint")}
          />
        }
      />
    </div>
  );
}
