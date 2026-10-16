import type { SiteGlobals } from "@slices/settings/contract";
import { orMessage } from "./or-message";

/**
 * About office panel rows (spec about-admin-editor S3). Pure (no React / next-intl) so the
 * tests can check it: the page maps each row to a `ContactSplitRow` (with a link when `href`
 * is set).
 *
 * - Labels: `contact.office_labels.<key>` → the i18n `pages.about.office.<key>` (`orMessage`).
 *   "Office Hours" keeps its Settings label (`officeHoursLabel`, else "Office Hours").
 * - Values: Settings (`getGlobals`). Address / bookings phone / email / hours fall back to the
 *   mock's literals only when the settings row is missing; the check-in phone and the website
 *   have no fallback — blank (or no row) hides their row.
 */

export const OFFICE_LABEL_KEYS = ["address", "bookings", "checkin", "email", "website"] as const;
export type OfficeLabelKey = (typeof OFFICE_LABEL_KEYS)[number];
export type OfficeLabels = Record<OfficeLabelKey, string>;

export interface OfficeRow {
  key: OfficeLabelKey | "hours";
  label: string;
  text: string;
  /** `tel:` / `mailto:` / the website URL; absent for plain-text rows. */
  href?: string;
}

/** Address / bookings phone / email / hours when no settings row exists (the mock's values). */
const OFFICE_FALLBACK = {
  address: "Rua da Bempostinha 21A, 1150-065 Lisboa, Portugal",
  phone: "+351 910 075 725",
  email: "info@centralhill.pt",
  hours: "Monday – Friday · 09:30 – 18:00",
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** The website's visible text: the URL without `https://` (or `http://`) and trailing slashes. */
export function websiteText(url: string): string {
  return url.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

/** Each label: the page field when filled, else `message(key)` (the i18n default). */
export function resolveOfficeLabels(
  fields: Partial<Record<OfficeLabelKey, string | null | undefined>> | undefined,
  message: (key: OfficeLabelKey) => string,
): OfficeLabels {
  return Object.fromEntries(
    OFFICE_LABEL_KEYS.map((k) => [k, orMessage(fields?.[k], message(k))]),
  ) as OfficeLabels;
}

type OfficeGlobals = Pick<
  SiteGlobals,
  "officeAddress" | "phone" | "checkinPhone" | "email" | "website" | "officeHours" | "officeHoursLabel"
>;

/** The office panel rows, in page order; check-in and website only when set in Settings. */
export function officeRows(globals: OfficeGlobals | null, labels: OfficeLabels): OfficeRow[] {
  const phone = globals?.phone || OFFICE_FALLBACK.phone;
  const email = globals?.email || OFFICE_FALLBACK.email;
  const checkin = globals?.checkinPhone?.trim() || "";
  const website = globals?.website?.trim() || "";
  const rows: (OfficeRow | null)[] = [
    { key: "address", label: labels.address, text: globals?.officeAddress || OFFICE_FALLBACK.address },
    { key: "bookings", label: labels.bookings, text: phone, href: telHref(phone) },
    checkin ? { key: "checkin", label: labels.checkin, text: checkin, href: telHref(checkin) } : null,
    { key: "email", label: labels.email, text: email, href: `mailto:${email}` },
    website ? { key: "website", label: labels.website, text: websiteText(website), href: website } : null,
    {
      key: "hours",
      label: globals?.officeHoursLabel || "Office Hours",
      text: globals?.officeHours || OFFICE_FALLBACK.hours,
    },
  ];
  return rows.filter((r): r is OfficeRow => r !== null);
}
