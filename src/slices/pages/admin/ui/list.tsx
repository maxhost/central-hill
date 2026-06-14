import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  StateBadge,
} from "@slices/backoffice/contract";
import { type PageAdminListItem, listPagesAdmin } from "../queries";

/**
 * Pages backoffice list (S12) at `/admin/pages` — the five fixed marketing pages
 * with their status, each linking to its schema-driven editor.
 */

const STATUS_TONE: Record<PageAdminListItem["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  none: "neutral",
};

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
    {
      header: t("admin.columns.status"),
      cell: (row) => (
        <StateBadge label={t(`admin.status.${row.status}`)} tone={STATUS_TONE[row.status]} />
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
