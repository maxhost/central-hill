/** Manual quote fields share one testimonial identity. */
export const TESTIMONIAL_QUOTE_LOCALES = ["en", "es", "pt", "fr"] as const;
export const TESTIMONIAL_QUOTE_TARGET_LOCALES = ["es", "pt", "fr"] as const;
export type TestimonialQuoteTranslations = Record<(typeof TESTIMONIAL_QUOTE_TARGET_LOCALES)[number], string>;
