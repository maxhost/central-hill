import type { SiteGlobals } from "./contract";

/**
 * Pre-seed fallback for the site-wide singleton. Until the backoffice (S12) writes a
 * `company_settings` row, the public chrome still needs real, locale-neutral contact
 * details so the header/footer render correctly. These are Central Hill's published
 * figures (source: the `mock/` reference + centralhill.pt) — overridden by the DB the
 * moment settings are configured. Translatable bits (stat labels) carry English
 * source values here; localized labels arrive via `core/i18n` once authored.
 *
 * Note: the **default navigation** is NOT here — it is localized chrome, so it lives
 * in the header/footer components via i18n (`settings.nav.*`). This file is only the
 * locale-neutral globals fallback.
 */
export const DEFAULT_GLOBALS: SiteGlobals = {
  email: "info@centralhill.pt",
  phone: "+351 910 075 725",
  whatsapp: "+351 910 075 725",
  social: {},
  stats: {
    bookings: { value: "60,000+", label: "Bookings Completed" },
    years: { value: "12+", label: "Years of Experience" },
    guests: { value: "700,000+", label: "Guests Hosted" },
    revenue: { value: "€55M+", label: "Revenue Generated" },
    buildings: { value: "", label: "Buildings" },
    apartments: { value: "", label: "Apartments" },
  },
  officeAddress: "Lisbon, Portugal",
  officeHours: null,
  officeHoursLabel: null,
  currency: "EUR",
  defaultOgImage: null,
  avantio: { accountId: "", widgetConfig: {} },
  showBuildingLocation: false,
  showBuildingCount: false,
};
