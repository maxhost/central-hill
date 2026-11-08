import "server-only";
import type { Locale } from "@core/db/columns";
import { setSourceContent, setTargetTranslation, type TranslationRow } from "@core/i18n";
import en from "../../../../messages/en.json";
import es from "../../../../messages/es.json";
import pt from "../../../../messages/pt.json";
import fr from "../../../../messages/fr.json";
import { COMPANY_SETTINGS } from "../contract";
import {
  NAVIGATION_CTA_LOCALES,
  NAVIGATION_CTAS_FIELD,
  navigationCtasSchema,
  type NavigationCtas,
  type NavigationCtasByLocale,
} from "../navigation-cta-types";

type CtaRow = Pick<TranslationRow, "locale" | "field" | "value" | "state">;
const messages = { en, es, pt, fr };
const BOOKING_URL = "https://www.centralhill.pt/en/rentals/holidays-rentals-rentals-d0/";

/** Existing labels/destination remain authoritative until Settings is configured. */
export function defaultNavigationCtas(locale: Locale): NavigationCtas {
  return {
    book: { label: messages[locale].settings.ctaBook, url: BOOKING_URL },
    earn: { label: messages[locale].settings.ctaEarn },
  };
}

const blankTargets = (): NavigationCtas => ({ book: { label: "", url: "" }, earn: { label: "" } });

/** Read raw strings for the form, including pending/invalid authored values. */
function authoredCtas(value: string | undefined): NavigationCtas | null {
  if (value === undefined) return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed?.book?.label !== "string" || typeof parsed?.book?.url !== "string" ||
        typeof parsed?.earn?.label !== "string") return null;
    return { book: { label: parsed.book.label, url: parsed.book.url }, earn: { label: parsed.earn.label } };
  } catch {
    return null;
  }
}

export function navigationCtasForEdit(rows: readonly Pick<CtaRow, "locale" | "field" | "value">[]): NavigationCtasByLocale {
  const source = rows.find((row) => row.field === NAVIGATION_CTAS_FIELD && row.locale === "en");
  return Object.fromEntries(NAVIGATION_CTA_LOCALES.map((locale) => {
    const authored = authoredCtas(rows.find((row) => row.field === NAVIGATION_CTAS_FIELD && row.locale === locale)?.value);
    return [locale, authored ?? (source && locale !== "en" ? blankTargets() : defaultNavigationCtas(locale))];
  })) as NavigationCtasByLocale;
}

/** Targets resolve field by field, without source-hash coupling to later English edits. */
export function resolveNavigationCtas(locale: Locale, rows: readonly CtaRow[]): NavigationCtas {
  const source = authoredCtas(rows.find((row) => row.field === NAVIGATION_CTAS_FIELD && row.locale === "en")?.value);
  const english = navigationCtasSchema.safeParse(source);
  const fallback = english.success ? english.data : defaultNavigationCtas(locale);
  if (locale === "en") return fallback;
  const target = authoredCtas(rows.find((row) =>
    row.field === NAVIGATION_CTAS_FIELD && row.locale === locale && row.state === "approved",
  )?.value);
  if (!target) return fallback;
  const bookLabel = navigationCtasSchema.shape.book.shape.label.safeParse(target.book.label);
  const bookUrl = navigationCtasSchema.shape.book.shape.url.safeParse(target.book.url);
  const earnLabel = navigationCtasSchema.shape.earn.shape.label.safeParse(target.earn.label);
  return {
    book: {
      label: bookLabel.success ? bookLabel.data : fallback.book.label,
      url: bookUrl.success ? bookUrl.data : fallback.book.url,
    },
    earn: { label: earnLabel.success ? earnLabel.data : fallback.earn.label },
  };
}

/** Omitted legacy payloads never materialize or overwrite CTA configuration. */
export async function saveNavigationCtas(id: string, input?: NavigationCtasByLocale, updatedBy?: string): Promise<void> {
  if (!input) return;
  const source = JSON.stringify(input.en);
  await setSourceContent(COMPANY_SETTINGS, id, { [NAVIGATION_CTAS_FIELD]: source }, { updatedBy });
  for (const locale of NAVIGATION_CTA_LOCALES) {
    if (locale === "en") continue;
    await setTargetTranslation(COMPANY_SETTINGS, id, NAVIGATION_CTAS_FIELD, locale, JSON.stringify(input[locale]), {
      sourceValue: source,
      state: "approved",
      updatedBy,
    });
  }
}
