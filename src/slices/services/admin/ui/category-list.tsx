import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
} from "@slices/backoffice/contract";
import { type ServiceCategoryAdminListItem, listServiceCategoriesAdmin } from "../queries";

/**
 * Service-category backoffice list (S12) at `/admin/service-categories`. Server
 * component. Strings come from the `services` namespace.
 */
export async function ServiceCategoriesAdminList() {
  const t = await getTranslations("services");
  const rows = await listServiceCategoriesAdmin();

  const columns: Column<ServiceCategoryAdminListItem>[] = [
    {
      header: t("admin.cat.columns.name"),
      cell: (row) => (
        <Link
          href={`/admin/service-categories/${row.id}`}
          className="font-medium text-ink hover:text-accent-deep"
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: t("admin.cat.columns.slug"),
      cell: (row) => <span className="text-ink-soft">{row.slug}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: t("admin.cat.columns.icon"),
      cell: (row) => <span className="text-ink-soft">{row.icon}</span>,
      className: "hidden md:table-cell",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.cat.title")}
        description={t("admin.cat.subtitle")}
        actions={
          <Link
            href="/admin/service-categories/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.cat.newCategory")}
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={<EmptyState title={t("admin.cat.empty")} hint={t("admin.cat.emptyHint")} />}
      />
    </div>
  );
}
