import "server-only";
import {
  deleteTranslation,
  setSourceContent,
  setTargetTranslation,
  type TranslationRow,
} from "@core/i18n";
import { TESTIMONIAL } from "../contract";
import {
  TESTIMONIAL_QUOTE_TARGET_LOCALES,
  type TestimonialQuoteTranslations,
} from "../quote-locale-types";

/** Return authored values, including pending targets, with no EN copies. */
export function rawTestimonialQuoteTranslations(
  rows: readonly Pick<TranslationRow, "locale" | "field" | "value">[],
): TestimonialQuoteTranslations {
  return Object.fromEntries(
    TESTIMONIAL_QUOTE_TARGET_LOCALES.map((locale) => [
      locale,
      rows.find((row) => row.locale === locale && row.field === "quote")?.value ?? "",
    ]),
  ) as TestimonialQuoteTranslations;
}

/** Called only after staff authentication and complete input validation. */
export async function saveTestimonialQuotes(
  id: string,
  input: { quote: string; translations?: TestimonialQuoteTranslations },
  updatedBy?: string,
): Promise<void> {
  await setSourceContent(TESTIMONIAL, id, { quote: input.quote }, { updatedBy });
  // Older clients cannot accidentally clear targets they do not send.
  if (!input.translations) return;
  for (const locale of TESTIMONIAL_QUOTE_TARGET_LOCALES) {
    const value = input.translations[locale].trim();
    if (value) {
      await setTargetTranslation(TESTIMONIAL, id, "quote", locale, value, {
        sourceValue: input.quote,
        state: "approved",
        updatedBy,
      });
    } else {
      await deleteTranslation(TESTIMONIAL, id, "quote", locale);
    }
  }
}
