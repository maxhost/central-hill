import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
} from "@slices/backoffice/contract";
import { type BlogCategoryAdminListItem, listBlogCategoriesAdmin } from "../queries";

/** Blog-category backoffice list (S12) at `/admin/blog-categories`. */
export async function BlogCategoriesAdminList() {
  const t = await getTranslations("blog");
  const rows = await listBlogCategoriesAdmin();

  const columns: Column<BlogCategoryAdminListItem>[] = [
    {
      header: t("admin.cat.columns.name"),
      cell: (row) => (
        <Link
          href={`/admin/blog-categories/${row.id}`}
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
      header: t("admin.cat.columns.color"),
      cell: (row) => (
        <span className="inline-flex items-center gap-2 text-ink-soft">
          <span
            className="inline-block size-4 rounded-full border border-line"
            style={{ backgroundColor: row.color ?? undefined }}
          />
          {row.color}
        </span>
      ),
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
            href="/admin/blog-categories/new"
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
