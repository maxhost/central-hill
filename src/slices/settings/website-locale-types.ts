/** Website authoring uses one EN column and three manual locale URL overrides. */
export const WEBSITE_LOCALES = ["en", "es", "pt", "fr"] as const;
export const WEBSITE_TARGET_LOCALES = ["es", "pt", "fr"] as const;
export type WebsiteTranslations = Record<(typeof WEBSITE_TARGET_LOCALES)[number], string>;
/** Other Settings copy retains its legacy workflow; Website URLs belong to its ficha. */
export const isSettingsWebsiteField = (type: string, field: string): boolean =>
  type === "company_settings" && field === "website_url";
