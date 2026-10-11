/**
 * Contact line built from the Settings singleton (data-model.md → company_settings): the
 * owner panel of Home's closing dual CTA and the Owners closing band (spec owners-admin-editor
 * S6) share it. Pure (no React / next-intl) so the tests can cover it.
 */
import { orMessage } from "./or-message";

/** The Settings fields the line is made of (a subset of `SiteGlobals`). */
export type ContactPoints = { phone: string; email: string; whatsapp: string | null };

/**
 * `phone · email · WhatsApp <whatsapp>`, skipping empty parts. `formatPhone` wraps the phone
 * (Owners: "Call {phone}"); Home passes none, so its output is unchanged. No settings → null.
 */
export function settingsContactLine(
  globals: ContactPoints | null | undefined,
  formatPhone: (phone: string) => string = (phone) => phone,
): string | null {
  if (!globals) return null;
  return [
    globals.phone ? formatPhone(globals.phone) : null,
    globals.email,
    globals.whatsapp ? `WhatsApp ${globals.whatsapp}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Owners closing band's contact line: the page field when filled, otherwise the line built
 * from Settings with the localized "Call {phone}" prefix. Nothing to show → undefined.
 */
export function ownersFinalContactLine(
  field: string | null | undefined,
  globals: ContactPoints | null | undefined,
  formatPhone: (phone: string) => string,
): string | undefined {
  return orMessage(field, settingsContactLine(globals, formatPhone) ?? "") || undefined;
}
