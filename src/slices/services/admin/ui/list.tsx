import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  StateBadge,
} from "@slices/backoffice/contract";
import { type ServiceAdminListItem, listServicesAdmin } from "../queries";

/**
 * Services backoffice list (S12) at `/admin/services`. Server component: every status
 * live, links each row to its editor. Strings come from the `services` namespace.
 */

const STATUS_TONE: Record<ServiceAdminListItem["status"], "approved" | "draft" | "neutral"> = {
  published: "approved",
  draft: "draft",
  archived: "neutral",
};

export async function ServicesAdminList() {
  const t = await getTranslations("services");
  const rows = await listServicesAdmin();

  const columns: Column<ServiceAdminListItem>[] = [
    {
      header: t("admin.columns.name"),
      cell: (row) => (
        <Link href={`/admin/services/${row.id}`} className="font-medium text-ink hover:text-accent-deep">
          {row.name}
        </Link>
      ),
    },
    {
      header: t("admin.columns.status"),
      cell: (row) => (
        <StateBadge label={t(`admin.status.${row.status}`)} tone={STATUS_TONE[row.status]} />
      ),
    },
    {
      header: t("admin.columns.category"),
      cell: (row) => <span className="text-ink-soft">{row.category}</span>,
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
            href="/admin/services/new"
            className="rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            {t("admin.newService")}
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
