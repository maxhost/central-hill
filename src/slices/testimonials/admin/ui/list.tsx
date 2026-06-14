import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  StateBadge,
} from "@slices/backoffice/contract";
import { type TestimonialAdminListItem, listTestimonialsAdmin } from "../queries";

/**
 * Testimonials backoffice list (S12) at `/admin/testimonials`. Server component:
 * reads every status live (admin is dynamic, no ISR), links each row to its editor,
 * and offers a "new testimonial" action. Strings come from the `testimonials`
 * namespace.
 */

const STATUS_TONE: Record<TestimonialAdminListItem["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function TestimonialsAdminList() {
  const t = await getTranslations("testimonials");
  const rows = await listTestimonialsAdmin();

  const columns: Column<TestimonialAdminListItem>[] = [
    {
      header: t("admin.columns.author"),
      cell: (row) => (
        <Link
          href={`/admin/testimonials/${row.id}`}
          className="font-medium text-ink hover:text-accent-deep"
        >
          {row.authorName}
        </Link>
      ),
    },
    {
      header: t("admin.columns.audience"),
      cell: (row) => <span className="text-ink-soft">{t(`admin.audience.${row.audience}`)}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: t("admin.columns.rating"),
      cell: (row) => <span className="text-ink-soft">{"★".repeat(row.rating)}</span>,
      className: "hidden md:table-cell",
    },
    {
      header: t("admin.columns.country"),
      cell: (row) => <span className="text-ink-soft">{row.authorCountry}</span>,
      className: "hidden lg:table-cell",
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
      <AdminPageHeader
        title={t("admin.title")}
        description={t("admin.subtitle")}
        actions={
          <Link
            href="/admin/testimonials/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.newTestimonial")}
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
