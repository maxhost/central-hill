import "server-only";
import type { Locale } from "@core/db/columns";
import {
  deleteTranslation,
  loadContent,
  setSourceContent,
  setTargetTranslation,
  type TranslationRow,
} from "@core/i18n";
import {
  GEOGRAPHY_NAME_LOCALES,
  GEOGRAPHY_NAME_TARGET_LOCALES,
  type GeographyNameOption,
  type GeographyNameTranslations,
} from "../reference-name-types";

type NameType = "city" | "neighbourhood";

/** Authored values, including pending targets; absent inputs stay empty. */
export function rawGeographyNameTranslations(
  rows: readonly Pick<TranslationRow, "locale" | "field" | "value">[],
): GeographyNameTranslations {
  return Object.fromEntries(
    GEOGRAPHY_NAME_TARGET_LOCALES.map((locale) => [
      locale,
      rows.find((row) => row.locale === locale && row.field === "name")
        ?.value ?? "",
    ]),
  ) as GeographyNameTranslations;
}

/** Validated staff actions use the existing sequential core write seam. */
export async function saveGeographyNames(
  type: NameType,
  id: string,
  input: { name: string; translations?: GeographyNameTranslations },
  updatedBy?: string,
): Promise<void> {
  await setSourceContent(type, id, { name: input.name }, { updatedBy });
  if (!input.translations) return;
  for (const locale of GEOGRAPHY_NAME_TARGET_LOCALES) {
    const value = input.translations[locale].trim();
    if (value)
      await setTargetTranslation(type, id, "name", locale, value, {
        sourceValue: input.name,
        state: "approved",
        updatedBy,
      });
    else await deleteTranslation(type, id, "name", locale);
  }
}

/** Approved locale labels with English fallback; stable IDs remain language neutral. */
export async function loadGeographyNameOptions(
  type: NameType,
  rows: readonly { id: string; slug: string }[],
): Promise<GeographyNameOption[]> {
  if (!rows.length) return [];
  const contents = await Promise.all(
    GEOGRAPHY_NAME_LOCALES.map((locale) =>
      loadContent(
        rows.map((row) => ({ type, id: row.id })),
        locale,
      ),
    ),
  );
  return rows.map((row) => {
    const name = contents[0]!.get(type, row.id, "name")?.trim() || row.slug;
    return {
      id: row.id,
      name,
      labels: Object.fromEntries(
        GEOGRAPHY_NAME_LOCALES.map((locale, index) => [
          locale,
          contents[index]!.get(type, row.id, "name")?.trim() || name,
        ]),
      ) as Record<Locale, string>,
    };
  });
}
