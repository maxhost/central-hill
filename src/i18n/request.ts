import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import en from "../../messages/en.json";
import pt from "../../messages/pt.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";

/**
 * Per-request i18n config. UI-chrome messages come from `messages/<locale>.json`
 * (next-intl); DB content translations are resolved separately via the
 * `translation` table in `core/i18n`.
 *
 * Messages are **statically imported** (not `import(\`…/${locale}.json\`)`): a
 * computed dynamic-import path is not reliably traced into serverless function
 * bundles (Netlify/Vercel), so dynamic routes that resolve messages at request time
 * — the `/admin` backoffice — 500'd with the JSON missing. A static map bundles all
 * four locales everywhere; the per-page size cost is negligible.
 */
type Loc = (typeof routing.locales)[number];
const MESSAGES: Record<Loc, unknown> = { en, pt, es, fr };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: MESSAGES[locale] as Record<string, unknown>,
  };
});
