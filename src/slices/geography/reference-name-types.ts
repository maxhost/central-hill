import type { Locale } from "@core/db/columns";
export const GEOGRAPHY_NAME_LOCALES = ["en", "es", "pt", "fr"] as const;
export const GEOGRAPHY_NAME_TARGET_LOCALES = ["es", "pt", "fr"] as const;
export type GeographyNameTranslations = Record<(typeof GEOGRAPHY_NAME_TARGET_LOCALES)[number], string>;
export interface GeographyNameOption {
  id: string;
  name: string;
  labels?: Record<Locale, string>;
}
export interface GeographyLocationOptions {
  cities: GeographyNameOption[];
  neighbourhoods: (GeographyNameOption & { cityId: string })[];
}
