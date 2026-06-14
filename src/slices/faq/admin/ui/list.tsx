import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
} from "@slices/backoffice/contract";
import { type FaqGroupAdminListItem, listFaqGroupsAdmin } from "../queries";

/**
 * FAQ backoffice list (S12) at `/admin/faq`. Server component: lists the marketing
 * FAQ groups with their item counts, links each to its editor, and offers a "new
 * group" action. Strings come from the `faq` namespace.
 */
export async function FaqAdminList() {
  const t = await getTranslations("faq");
  const rows = await listFaqGroupsAdmin();

  const columns: Column<FaqGroupAdminListItem>[] = [
    {
      header: t("admin.columns.key"),
      cell: (row) => (
        <Link href={`/admin/faq/${row.id}`} className="font-medium text-ink hover:text-accent-deep">
          {row.key}
        </Link>
      ),
    },
    {
      header: t("admin.columns.items"),
      cell: (row) => <span className="text-ink-soft">{row.itemCount}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: t("admin.columns.position"),
      cell: (row) => <span className="text-ink-soft">{row.position}</span>,
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
            href="/admin/faq/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.newGroup")}
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
