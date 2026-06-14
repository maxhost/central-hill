import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  type Column,
  DataTable,
  EmptyState,
  StateBadge,
} from "@slices/backoffice/contract";
import { cn } from "@core/ui";
import type { LeadKind } from "../../validation";
import { formatAdminDate, LEAD_KINDS, statusTone } from "../derive";
import {
  type LeadListFilters,
  type LeadListItem,
  type LeadStatus,
  type LeadStatusCounts,
  LEAD_LIST_LIMIT,
  leadStatusCounts,
  listLeads,
} from "../queries";

/**
 * Backoffice leads inbox (S12) — the list screen at `/admin/leads`. Server
 * component: reads live (leads are not public content, no ISR), renders status +
 * kind filter chips (URL-driven) and a `DataTable` of captures. Each row links to
 * the detail/audit screen. Strings come from the `leads` namespace.
 */

const STATUS_TABS: (LeadStatus | "all")[] = ["all", "new", "in_progress", "closed"];

/** Build an `/admin/leads` href, merging the given status/kind into the query. */
function filterHref(next: { status?: LeadStatus | "all"; kind?: LeadKind | "all" }): string {
  const params = new URLSearchParams();
  if (next.status && next.status !== "all") params.set("status", next.status);
  if (next.kind && next.kind !== "all") params.set("kind", next.kind);
  const qs = params.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-accent bg-accent/10 font-medium text-accent-deep"
          : "border-line text-ink-soft hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

export async function LeadsInbox({ filters }: { filters: LeadListFilters }) {
  const t = await getTranslations("leads");
  const [rows, counts] = await Promise.all([
    listLeads(filters),
    leadStatusCounts(filters.kind),
  ]);

  const activeStatus: LeadStatus | "all" = filters.status ?? "all";
  const activeKind: LeadKind | "all" = filters.kind ?? "all";
  const countFor = (s: LeadStatus | "all") => (counts as LeadStatusCounts & Record<string, number>)[s];

  const columns: Column<LeadListItem>[] = [
    {
      header: t("admin.columns.contact"),
      cell: (row) => (
        <Link href={`/admin/leads/${row.id}`} className="font-medium text-ink hover:text-accent-deep">
          {row.title}
        </Link>
      ),
    },
    { header: t("admin.columns.kind"), cell: (row) => <StateBadge label={t(`admin.kind.${row.kind}`)} /> },
    {
      header: t("admin.columns.email"),
      cell: (row) => (row.email ? <span className="text-ink-soft">{row.email}</span> : "—"),
    },
    {
      header: t("admin.columns.source"),
      cell: (row) => <span className="text-ink-soft">{row.source_page}</span>,
      className: "hidden lg:table-cell",
    },
    {
      header: t("admin.columns.locale"),
      cell: (row) => <span className="uppercase text-ink-soft">{row.locale}</span>,
      className: "hidden md:table-cell",
    },
    {
      header: t("admin.columns.consent"),
      cell: (row) => (row.marketing_consent ? t("admin.consentYes") : t("admin.consentNo")),
      className: "hidden md:table-cell",
    },
    {
      header: t("admin.columns.status"),
      cell: (row) => <StateBadge label={t(`admin.status.${row.status}`)} tone={statusTone(row.status)} />,
    },
    {
      header: t("admin.columns.created"),
      cell: (row) => <span className="whitespace-nowrap text-ink-soft">{formatAdminDate(row.created_at)}</span>,
      className: "hidden sm:table-cell",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.title")} description={t("admin.subtitle")} />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((s) => (
            <Chip key={s} href={filterHref({ status: s, kind: activeKind })} active={activeStatus === s}>
              {t(`admin.filters.${s}`)} <span className="text-ink-soft/70">({countFor(s)})</span>
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip href={filterHref({ status: activeStatus, kind: "all" })} active={activeKind === "all"}>
            {t("admin.filters.allKinds")}
          </Chip>
          {LEAD_KINDS.map((k) => (
            <Chip key={k} href={filterHref({ status: activeStatus, kind: k })} active={activeKind === k}>
              {t(`admin.kind.${k}`)}
            </Chip>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        empty={<EmptyState title={t("admin.empty")} hint={t("admin.emptyHint")} />}
      />

      {rows.length === LEAD_LIST_LIMIT ? (
        <p className="text-xs text-ink-soft">{t("admin.truncated", { limit: LEAD_LIST_LIMIT })}</p>
      ) : null}
    </div>
  );
}
