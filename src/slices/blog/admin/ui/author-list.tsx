import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  StateBadge,
} from "@slices/backoffice/contract";
import { type AuthorAdminListItem, listAuthorsAdmin } from "../queries";

/** Author backoffice list (S12) at `/admin/authors`. */

const STATUS_TONE: Record<AuthorAdminListItem["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function AuthorsAdminList() {
  const t = await getTranslations("blog");
  const rows = await listAuthorsAdmin();

  const columns: Column<AuthorAdminListItem>[] = [
    {
      header: t("admin.author.columns.name"),
      cell: (row) => (
        <Link href={`/admin/authors/${row.id}`} className="font-medium text-ink hover:text-accent-deep">
          {row.name}
        </Link>
      ),
    },
    {
      header: t("admin.author.columns.slug"),
      cell: (row) => <span className="text-ink-soft">{row.slug}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: t("admin.author.columns.status"),
      cell: (row) => (
        <StateBadge label={t(`admin.status.${row.status}`)} tone={STATUS_TONE[row.status]} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.author.title")}
        description={t("admin.author.subtitle")}
        actions={
          <Link
            href="/admin/authors/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.author.newAuthor")}
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={<EmptyState title={t("admin.author.empty")} hint={t("admin.author.emptyHint")} />}
      />
    </div>
  );
}
