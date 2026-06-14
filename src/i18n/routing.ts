import { defineRouting } from "next-intl/routing";

/**
 * The 4 locales are all **path-prefixed** (CLAUDE.md → i18n). `en` is the source
 * locale and the fallback for un-approved translations (see translation model).
 */
export const routing = defineRouting({
  locales: ["en", "pt", "es", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
});
