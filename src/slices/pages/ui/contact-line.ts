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

/** One "label + link" line of an enquiry contact block (structurally `core/ui`'s `EnquiryContactLine`). */
export type EnquiryContactLineData = { label: string; href: string; text: string };

/** The Settings fields the Real Estate enquiry contact block reads (a subset of `SiteGlobals`). */
export type EnquiryContactPoints = { email: string; phone: string; social: { linkedin?: string } };

/** Pre-translated labels (`pages.realEstate.contact*`) of the enquiry contact block. */
export type EnquiryContactLabels = { email: string; phone: string; linkedin: string; linkedinText: string };

const blank = (v: string | null | undefined): v is null | undefined | "" =>
  typeof v !== "string" || v.trim() === "";

/**
 * Real Estate `#deal-enquiry` contact lines from the Settings singleton (spec
 * real-estate-admin-editor S5): Email → `mailto:`, Tel → `tel:` with the spaces stripped,
 * LinkedIn → `social.linkedin` with a fixed i18n link text. A line whose Settings value is
 * missing is omitted; no settings → no lines.
 */
export function enquiryContactLines(
  globals: EnquiryContactPoints | null | undefined,
  labels: EnquiryContactLabels,
): EnquiryContactLineData[] {
  if (!globals) return [];
  const lines: EnquiryContactLineData[] = [];
  const email = globals.email?.trim();
  if (!blank(email)) lines.push({ label: labels.email, href: `mailto:${email}`, text: email });
  const phone = globals.phone?.trim();
  if (!blank(phone)) lines.push({ label: labels.phone, href: `tel:${phone.replace(/\s+/g, "")}`, text: phone });
  const linkedin = globals.social?.linkedin?.trim();
  if (!blank(linkedin)) lines.push({ label: labels.linkedin, href: linkedin, text: labels.linkedinText });
  return lines;
}
