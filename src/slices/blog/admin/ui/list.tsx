import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  StateBadge,
} from "@slices/backoffice/contract";
import { type PostAdminListItem, listPostsAdmin } from "../queries";

/** Blog-posts backoffice list (S12) at `/admin/posts`. */

const STATUS_TONE: Record<PostAdminListItem["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function PostsAdminList() {
  const t = await getTranslations("blog");
  const rows = await listPostsAdmin();

  const columns: Column<PostAdminListItem>[] = [
    {
      header: t("admin.post.columns.title"),
      cell: (row) => (
        <Link href={`/admin/posts/${row.id}`} className="font-medium text-ink hover:text-accent-deep">
          {row.title}
        </Link>
      ),
    },
    {
      header: t("admin.post.columns.status"),
      cell: (row) => (
        <StateBadge label={t(`admin.status.${row.status}`)} tone={STATUS_TONE[row.status]} />
      ),
    },
    {
      header: t("admin.post.columns.category"),
      cell: (row) => <span className="text-ink-soft">{row.category}</span>,
      className: "hidden md:table-cell",
    },
    {
      header: t("admin.post.columns.featured"),
      cell: (row) =>
        row.isFeatured ? <StateBadge label={t("admin.post.featured")} tone="accent" /> : null,
      className: "hidden lg:table-cell",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.post.title")}
        description={t("admin.post.subtitle")}
        actions={
          <Link
            href="/admin/posts/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.post.newPost")}
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={<EmptyState title={t("admin.post.empty")} hint={t("admin.post.emptyHint")} />}
      />
    </div>
  );
}
