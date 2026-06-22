/**
 * Avantio booking-engine deep links (client feedback B2). Every "search / book"
 * button on the public site points to the Avantio rentals engine in the language the
 * visitor is browsing. Avantio only ships four languages — Portuguese, English,
 * Spanish, French — so any locale outside that set (e.g. a future `de`/`it`/`ar`)
 * falls back to the English engine.
 *
 * Pure module (no `server-only`): safe to import from both server components and
 * client islands. The base URL is Central Hill's published Avantio engine; if the
 * account ever moves, change it here (or promote it to `company_settings`).
 */

/** Locales Avantio supports natively. Anything else routes to `en`. */
export const AVANTIO_LOCALES = ["pt", "en", "es", "fr"] as const;
type AvantioLocale = (typeof AVANTIO_LOCALES)[number];

const AVANTIO_FALLBACK: AvantioLocale = "en";

/** `https://www.centralhill.pt/en/rentals/holidays-rentals-rentals-d0/` (per locale). */
function engineUrl(lang: AvantioLocale): string {
  return `https://www.centralhill.pt/${lang}/rentals/holidays-rentals-rentals-d0/`;
}

/**
 * The Avantio booking URL for the active `locale`, defaulting to the English engine
 * for any locale Avantio does not support.
 */
export function avantioBookingUrl(locale: string): string {
  const lang = (AVANTIO_LOCALES as readonly string[]).includes(locale)
    ? (locale as AvantioLocale)
    : AVANTIO_FALLBACK;
  return engineUrl(lang);
}

/**
 * Avantio owners-login destination for the header "Account" user icon (opens in a new tab).
 * Client-supplied deep link into the Avantio PMS login. Overridable here (or, later, via
 * `company_settings`).
 */
export const AVANTIO_OWNERS_LOGIN_URL =
  "https://app.avantio.pro/index.php?url=&module=Usuarios&action=Login&return_module=Home&return_action=index&avs=WjViQVd6NmtXVjdpZUgyQ0duMXpZTmt5TmdhZ08zSVpETGMyMVI2cDFCRzZiS2VoM3dCN0EydDMzdG0zMTV1eW5pUmlURjNDU1REdWRzdEZTODlidSsrYVduZVBQRXg2YlRvbWl3b0dDbmc9";
