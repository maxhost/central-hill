import type { Locale } from "@core/db/columns";

export const AMENITY_LABEL_LOCALES = ["en", "es", "pt", "fr"] as const;
export const AMENITY_TARGET_LOCALES = ["es", "pt", "fr"] as const;
export type AmenityLabels = Record<Locale, string>;
export type AmenityTranslations = Record<(typeof AMENITY_TARGET_LOCALES)[number], string>;
