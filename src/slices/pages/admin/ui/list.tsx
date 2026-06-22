import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, type Column, DataTable } from "@slices/backoffice/contract";
import { type PageAdminListItem, listPagesAdmin } from "../queries";

/**
 * Pages backoffice list (S12) at `/admin/pages` — the five fixed marketing pages,
 * each linking to its schema-driven editor. Pages have no draft/published state
 * (owner direction): a page is always live.
 */

export async function PagesAdminList() {
  const t = await getTranslations("pages");
  const rows = await listPagesAdmin();

  const columns: Column<PageAdminListItem>[] = [
    {
      header: t("admin.columns.page"),
      cell: (row) => (
        <Link
          href={`/admin/pages/${row.key}`}
          className="font-medium text-ink hover:text-accent-deep"
        >
          {t.has(`admin.pages.${row.key}`) ? t(`admin.pages.${row.key}`) : row.key}
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.title")} description={t("admin.subtitle")} />
      <DataTable columns={columns} rows={rows} getRowKey={(row) => row.key} />
    </div>
  );
}
