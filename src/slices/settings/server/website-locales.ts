import "server-only";
import type { Locale } from "@core/db/columns";
import { deleteTranslation, setTargetTranslation, type TranslationRow } from "@core/i18n";
import { COMPANY_SETTINGS } from "../contract";
import { WEBSITE_TARGET_LOCALES, type WebsiteTranslations } from "../website-locale-types";
import { httpsUrl } from "../validation";

type WebsiteRow = Pick<TranslationRow, "locale" | "field" | "value" | "state">;

/** Authored targets, including pending values; missing inputs remain blank. */
export function rawWebsiteTranslations(
  rows: readonly Pick<TranslationRow, "locale" | "field" | "value">[],
): WebsiteTranslations {
  return Object.fromEntries(WEBSITE_TARGET_LOCALES.map((locale) => [
    locale,
    rows.find((row) => row.field === "website_url" && row.locale === locale)?.value ?? "",
  ])) as WebsiteTranslations;
}

/** The inline EN URL remains canonical, even when legacy EN translation rows exist. */
export function resolveWebsiteUrl(
  baseEN: string | null | undefined,
  locale: Locale,
  rows: readonly WebsiteRow[],
): string | null {
  const english = baseEN?.trim() || null;
  if (locale === "en") return english;
  const target = rows.find((row) =>
    row.field === "website_url" && row.locale === locale && row.state === "approved",
  )?.value.trim();
  return target && httpsUrl.safeParse(target).success ? target : english;
}

/** Manual targets only: EN lives in website_url and is never mirrored or cleared here. */
export async function saveWebsiteTranslations(
  id: string,
  baseEN: string | null | undefined,
  targets?: WebsiteTranslations,
  updatedBy?: string,
): Promise<void> {
  if (!targets) return;
  for (const locale of WEBSITE_TARGET_LOCALES) {
    const value = targets[locale].trim();
    if (value) {
      await setTargetTranslation(COMPANY_SETTINGS, id, "website_url", locale, value, {
        sourceValue: baseEN ?? "",
        state: "approved",
        updatedBy,
      });
    } else {
      await deleteTranslation(COMPANY_SETTINGS, id, "website_url", locale);
    }
  }
}
