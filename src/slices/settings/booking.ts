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
 * Avantio owners-login (extranet) destination for the header user icon. The client
 * will supply the final branded URL; until then this points at the Avantio extranet
 * login. Overridable here (or, later, via `company_settings`).
 */
export const AVANTIO_OWNERS_LOGIN_URL = "https://extranet.avantio.com/";
