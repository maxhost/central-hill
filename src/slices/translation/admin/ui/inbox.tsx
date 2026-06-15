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
import { formatAdminDate, type InboxItem, type Rollup } from "../derive";
import {
  getTranslationInbox,
  type TranslationInboxFilters,
} from "../queries";

/**
 * Translation review inbox (S14) — the list screen at `/admin/translations`. Server
 * component: reads live (backoffice, no ISR), shows view + entity-type filter chips
 * (URL-driven) and a `DataTable` of entities with their target-cell rollup. Each row
 * links to the per-entity review screen. Strings come from the `translation`
 * namespace; entity-type labels fall back to the raw type when unkeyed.
 */

const VIEWS = ["all", "attention", "done"] as const;
type View = (typeof VIEWS)[number];

function filterHref(next: { view?: View; entityType?: string }): string {
  const params = new URLSearchParams();
  if (next.view && next.view !== "all") params.set("view", next.view);
  if (next.entityType) params.set("type", next.entityType);
  const qs = params.toString();
  return qs ? `/admin/translations?${qs}` : "/admin/translations";
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

/** Compact per-state counts; only non-zero buckets render. */
export function RollupBadges({ rollup, t }: { rollup: Rollup; t: (k: string) => string }) {
  const cells: { key: keyof Rollup; tone: "neutral" | "review" | "approved" }[] = [
    { key: "missing", tone: "neutral" },
    { key: "stale", tone: "review" },
    { key: "needsReview", tone: "review" },
    { key: "approved", tone: "approved" },
  ];
  const shown = cells.filter((c) => rollup[c.key] > 0);
  if (shown.length === 0) return <span className="text-ink-soft">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((c) => (
        <StateBadge key={c.key} tone={c.tone} label={`${t(`status.${c.key}`)} ${rollup[c.key]}`} />
      ))}
    </div>
  );
}

export async function TranslationInbox({ filters }: { filters: TranslationInboxFilters }) {
  const t = await getTranslations("translation");
  const { items, counts, entityTypes } = await getTranslationInbox(filters);
  const typeLabel = (type: string) => t.has(`entityTypes.${type}`) ? t(`entityTypes.${type}`) : type;

  const activeView: View = filters.view ?? "all";
  const activeType = filters.entityType;

  const columns: Column<InboxItem>[] = [
    {
      header: t("columns.entity"),
      cell: (row) => (
        <Link
          href={`/admin/translations/${row.entityType}/${row.entityId}`}
          className="font-medium text-ink hover:text-accent-deep"
        >
          {row.title}
        </Link>
      ),
    },
    {
      header: t("columns.type"),
      cell: (row) => <StateBadge label={typeLabel(row.entityType)} />,
    },
    {
      header: t("columns.fields"),
      cell: (row) => <span className="text-ink-soft">{row.fieldCount}</span>,
      className: "hidden sm:table-cell",
    },
    {
      header: t("columns.progress"),
      cell: (row) => <RollupBadges rollup={row.rollup} t={t} />,
    },
    {
      header: t("columns.updated"),
      cell: (row) => (
        <span className="whitespace-nowrap text-ink-soft">{formatAdminDate(row.updatedAt)}</span>
      ),
      className: "hidden md:table-cell",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("title")} description={t("subtitle")} />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <Chip key={v} href={filterHref({ view: v, entityType: activeType })} active={activeView === v}>
              {t(`views.${v}`)}
            </Chip>
          ))}
        </div>
        {entityTypes.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            <Chip href={filterHref({ view: activeView })} active={!activeType}>
              {t("allTypes")}
            </Chip>
            {entityTypes.map((type) => (
              <Chip
                key={type}
                href={filterHref({ view: activeView, entityType: type })}
                active={activeType === type}
              >
                {typeLabel(type)}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <StateBadge tone="neutral" label={`${t("status.missing")} ${counts.missing}`} />
        <StateBadge tone="review" label={`${t("status.stale")} ${counts.stale}`} />
        <StateBadge tone="review" label={`${t("status.needsReview")} ${counts.needsReview}`} />
        <StateBadge tone="approved" label={`${t("status.approved")} ${counts.approved}`} />
      </div>

      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(row) => `${row.entityType}:${row.entityId}`}
        empty={<EmptyState title={t("empty")} hint={t("emptyHint")} />}
      />
    </div>
  );
}
