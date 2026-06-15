import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import {
  AdminPageHeader,
  EmptyState,
  StateBadge,
  TranslationFieldRow,
} from "@slices/backoffice/contract";
import { cn } from "@core/ui";
import { type CellStatus, statusTone, TARGET_LOCALES } from "../derive";
import { getEntityTranslations } from "../queries";
import { RollupBadges } from "./inbox";
import { EntityActions } from "./entity-actions";
import { TranslationRowActions } from "./row-actions";

/**
 * Per-entity translation review screen (S14) at
 * `/admin/translations/[type]/[id]`. Server component: loads the source-vs-target
 * matrix, shows the rollup + entity-level actions, target-locale tabs, and one
 * `TranslationFieldRow` per [T] field for the selected locale (source · target ·
 * state badge · per-cell actions). `notFound()` when the entity has no [T] rows.
 */

const STATUS_KEY: Record<CellStatus, string> = {
  missing: "missing",
  stale: "stale",
  needs_review: "needsReview",
  approved: "approved",
};

export async function TranslationReview({
  type,
  id,
  locale,
}: {
  type: string;
  id: string;
  locale?: string;
}) {
  const t = await getTranslations("translation");
  const entity = await getEntityTranslations(type, id);
  if (!entity) notFound();

  const typeLabel = t.has(`entityTypes.${type}`) ? t(`entityTypes.${type}`) : type;
  const selected: Locale =
    locale && (TARGET_LOCALES as string[]).includes(locale)
      ? (locale as Locale)
      : TARGET_LOCALES[0]!;

  const tabHref = (l: Locale) => `/admin/translations/${type}/${id}?locale=${l}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={entity.title}
        description={typeLabel}
        actions={<EntityActions type={type} id={id} />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RollupBadges rollup={entity.rollup} t={t} />
        <Link href="/admin/translations" className="text-sm text-ink-soft hover:text-ink">
          {t("backToInbox")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {TARGET_LOCALES.map((l) => (
          <Link
            key={l}
            href={tabHref(l)}
            aria-current={l === selected ? "true" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm uppercase transition-colors",
              l === selected
                ? "border-accent bg-accent/10 font-medium text-accent-deep"
                : "border-line text-ink-soft hover:border-ink hover:text-ink",
            )}
          >
            {l}
          </Link>
        ))}
      </div>

      {entity.fields.length === 0 ? (
        <EmptyState title={t("noFields")} hint={t("noFieldsHint")} />
      ) : (
        <div className="rounded-lg border border-line bg-surface px-5">
          {entity.fields.map((row) => {
            const cell = row.cells.find((c) => c.locale === selected)!;
            return (
              <TranslationFieldRow
                key={row.field}
                field={row.field}
                source={row.source}
                target={cell.value}
                badge={
                  <StateBadge tone={statusTone(cell.status)} label={t(`status.${STATUS_KEY[cell.status]}`)} />
                }
                action={
                  <TranslationRowActions
                    type={type}
                    id={id}
                    field={row.field}
                    locale={selected}
                    status={cell.status}
                    value={cell.value}
                  />
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
