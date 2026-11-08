import "server-only";
import type { Locale } from "@core/db/columns";
import { deleteTranslation, setTargetTranslation, type TranslationRow } from "@core/i18n";
import { COMPANY_SETTINGS } from "../contract";
import {
  HOURS_LABEL_MAX,
  HOURS_LABEL_TARGET_LOCALES,
  OFFICE_HOURS_DEFAULT_LABELS,
  type HoursLabelTranslations,
} from "../hours-label-types";

type HoursRow = Pick<TranslationRow, "locale" | "field" | "value" | "state">;
const FIELD = "office_hours_label";

/** Raw authored targets, including pending values; absence remains a blank input. */
export function rawHoursLabelTranslations(
  rows: readonly Pick<HoursRow, "locale" | "field" | "value">[],
): HoursLabelTranslations {
  return Object.fromEntries(HOURS_LABEL_TARGET_LOCALES.map((locale) => [
    locale,
    rows.find((row) => row.field === FIELD && row.locale === locale)?.value ?? "",
  ])) as HoursLabelTranslations;
}

/** The inline EN label is canonical; legacy EN translation rows never revive it. */
export function resolveHoursLabel(
  baseEN: string | null | undefined,
  locale: Locale,
  rows: readonly HoursRow[],
): string {
  const english = baseEN?.trim();
  const fallback = english || OFFICE_HOURS_DEFAULT_LABELS[locale];
  if (locale === "en") return fallback;
  const target = rows.find((row) => row.field === FIELD && row.locale === locale && row.state === "approved")?.value.trim();
  return target && target.length <= HOURS_LABEL_MAX ? target : fallback;
}

/** Target-only manual writes: EN remains inline and historical source rows stay exact. */
export async function saveHoursLabelTranslations(
  id: string,
  baseEN: string | null | undefined,
  targets?: HoursLabelTranslations,
  updatedBy?: string,
): Promise<void> {
  if (!targets) return;
  for (const locale of HOURS_LABEL_TARGET_LOCALES) {
    const value = targets[locale].trim();
    if (value) {
      await setTargetTranslation(COMPANY_SETTINGS, id, FIELD, locale, value, {
        sourceValue: baseEN ?? "",
        state: "approved",
        updatedBy,
      });
    } else {
      await deleteTranslation(COMPANY_SETTINGS, id, FIELD, locale);
    }
  }
}
