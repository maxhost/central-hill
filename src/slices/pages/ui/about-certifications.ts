/**
 * About certification cards (spec `about-admin-editor` S4). Pure (no React / next-intl) so the
 * tests can import it.
 */
import { orMessage } from "./or-message";

/**
 * Alt text of a certification's R2 logo: the row's `logo_alt` (already overlaid for the
 * visitor's locale) → the row's `issuer`. The media-library alt is deliberately not used (the
 * library is going away).
 */
export function certLogoAlt(cert: { logo_alt?: string | null; issuer: string }): string {
  return orMessage(cert.logo_alt, cert.issuer);
}
