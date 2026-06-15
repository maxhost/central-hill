import "server-only";
import type { Locale } from "@core/db/columns";
import {
  getTranslateProvider,
  hashSource,
  loadTranslationRows,
  setTargetTranslation,
  type TranslateUnit,
} from "@core/i18n";
import { SOURCE_LOCALE, TARGET_LOCALES } from "../admin/derive";

/**
 * Draft-generation pipeline (S14 — ADR 0007/0021). For one entity, translate its
 * source-locale ([T]) fields into each target locale through the
 * `core/i18n` provider seam and persist them as `needs_review` drafts via the
 * kernel target-write seam. By default only **missing or stale** target cells are
 * (re)drafted; `overwrite` re-drafts every field. Never runs on the public path —
 * it is invoked from a `requireStaff`-gated admin action.
 */

export interface GenerateOptions {
  /** Restrict to these target locales (default: all targets). */
  locales?: Locale[];
  /** Re-draft even fresh, already-translated cells. */
  overwrite?: boolean;
  /** Staff id stamped on the written rows. */
  updatedBy?: string;
}

export interface GenerateSummary {
  provider: string;
  /** Drafts written, per target locale. */
  written: Partial<Record<Locale, number>>;
  total: number;
}

export async function generateDrafts(
  type: string,
  id: string,
  opts: GenerateOptions = {},
): Promise<GenerateSummary> {
  const provider = getTranslateProvider();
  const targets = (opts.locales ?? TARGET_LOCALES).filter((l) => l !== SOURCE_LOCALE);
  const summary: GenerateSummary = { provider: provider.name, written: {}, total: 0 };

  const rows = await loadTranslationRows({ type, id });
  const source = new Map<string, string>();
  for (const r of rows) if (r.locale === SOURCE_LOCALE && r.value.trim()) source.set(r.field, r.value);
  if (source.size === 0) return summary;

  for (const locale of targets) {
    // Existing target rows for this locale → decide which fields need a draft.
    const existing = new Map(rows.filter((r) => r.locale === locale).map((r) => [r.field, r]));
    const units: TranslateUnit[] = [];
    for (const [field, value] of source) {
      const current = existing.get(field);
      const stale = !current || current.source_hash !== hashSource(value);
      if (opts.overwrite || stale) units.push({ field, value });
    }
    if (units.length === 0) continue;

    const results = await provider.translate({
      entityType: type,
      sourceLocale: SOURCE_LOCALE,
      targetLocale: locale,
      units,
    });

    const sourceByField = new Map(units.map((u) => [u.field, u.value]));
    let written = 0;
    for (const r of results) {
      const sourceValue = sourceByField.get(r.field);
      if (sourceValue === undefined) continue; // provider returned an unknown field
      await setTargetTranslation(type, id, r.field, locale, r.value, {
        sourceValue,
        state: "needs_review",
        updatedBy: opts.updatedBy,
      });
      written += 1;
    }
    if (written > 0) {
      summary.written[locale] = written;
      summary.total += written;
    }
  }

  return summary;
}
