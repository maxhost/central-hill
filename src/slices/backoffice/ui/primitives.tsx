import type { ReactNode } from "react";
import { cn } from "@core/ui";

/**
 * Presentational admin primitives shared by every slice's `admin/` screens — the
 * list/CRUD/translation-review building blocks (S12). Pure (no hooks, no
 * `"use client"`) so slice **server** components can compose them directly;
 * interactive bits (forms, row actions) stay in each slice's own client islands.
 * Denser + more neutral than the public design system, but on the same tokens.
 */

/** Page title row with optional description and right-aligned actions. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        <h1 className="font-serif text-2xl leading-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Raised surface card for grouped admin content. */
export function AdminCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-surface p-5", className)}>
      {title ? (
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

/** Empty-list / nothing-yet placeholder. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{hint}</p> : null}
    </div>
  );
}

type Tone = "neutral" | "draft" | "review" | "approved" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-line/60 text-ink-soft",
  draft: "bg-line/60 text-ink-soft",
  review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  accent: "bg-accent/10 text-accent-deep",
};

/** Small status pill (translation states, lead status, …). */
export function StateBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[tone])}>
      {label}
    </span>
  );
}

export interface Column<T> {
  /** Header label (already localized by the caller). */
  header: string;
  /** Cell renderer for a row. */
  cell: (row: T) => ReactNode;
  /** Optional extra classes for the cell + header (alignment, width). */
  className?: string;
}

/** Generic list table used by slice admin index screens. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-bg/60">
            {columns.map((c, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-line last:border-0 hover:bg-bg/40">
              {columns.map((c, i) => (
                <td key={i} className={cn("px-4 py-3 align-top text-ink", c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Source-vs-target row scaffold for translation review (S14 builds the workflow
 * on top of this). Shows the field name, the source value, the target value (or
 * an empty hint), a state badge, and any per-row action.
 */
export function TranslationFieldRow({
  field,
  source,
  target,
  badge,
  action,
}: {
  field: string;
  source: string;
  target?: string;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-line py-4 last:border-0 md:grid-cols-[10rem_1fr_1fr_auto] md:items-start">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{field}</div>
      <p className="text-sm text-ink-soft">{source}</p>
      <p className={cn("text-sm", target ? "text-ink" : "italic text-ink-soft/60")}>
        {target ?? "—"}
      </p>
      <div className="flex items-center gap-2">
        {badge}
        {action}
      </div>
    </div>
  );
}
