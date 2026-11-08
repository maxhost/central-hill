/**
 * Public contract of slice `settings` / `globals` (the ONLY surface other slices may
 * import). Produces the site-wide singleton read model (`SiteGlobals`) and the
 * navigation trees (`NavLink[]`) that the app shell composes into the header/footer,
 * plus the cache tags consumers subscribe to (docs/vertical-slices.md → S11).
 *
 * Settings has **no public routes of its own**: its data is *embedded* in the layout
 * chrome (header/footer) and in S9 pages (contact, stats, default OG image). Consumers
 * that embed globals/nav in their own cached reads should add the relevant tag below.
 * [T] fields (stat labels, `office_hours_label`, nav `label`) resolve via `core/i18n`.
 */
import type { MediaImageData } from "@core/media";
import type { SiteIcons } from "./site-icons";

/** Site icons: keys, defaults and types (client-safe; ADR 0034 amendment 2). */
export {
  SITE_ICON_DEFAULTS,
  SITE_ICON_KEYS,
  type SiteIconKey,
  type SiteIcons,
} from "./site-icons";

/** Entity types used for translation keys and cache tags. */
export const COMPANY_SETTINGS = "company_settings" as const;
export const NAV_ITEM = "nav_item" as const;

/**
 * Cache tags this slice owns (conventions.md → "Cache tags: …, `globals`, `nav`").
 * Both reads are site-wide singletons that change rarely. **Consumers embedding
 * globals/nav in their own cached reads should add these tags** so a settings publish
 * busts them too.
 */
export const SETTINGS_TAGS = {
  globals: "globals",
  nav: "nav",
} as const;

/** The six headline company figures (data-model.md → settings). */
export type StatKey =
  | "bookings"
  | "years"
  | "guests"
  | "revenue"
  | "buildings"
  | "apartments";

/** A headline stat: a figure string (e.g. `60,000+`) + its translated label. */
export interface CompanyStat {
  value: string;
  label: string;
}

/** Social profiles (only present keys are set). */
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

/** Site-wide singleton read model (contact, stats, office, Avantio, default OG). */
export interface SiteGlobals {
  /** Locale-resolved Book Now and floating Earn With Us configuration. */
  navigationCtas?: import("./navigation-cta-types").NavigationCtas;
  email: string;
  phone: string;
  whatsapp: string | null;
  /** Shared Owners phone; explicit null/blank hides its footer row. */
  ownersPhone?: string | null;
  /** Check-in phone (About office panel); null when unset — the row is then hidden. */
  checkinPhone: string | null;
  /** Website resolved for the requested locale (own approved URL or EN); null hides About row. */
  website: string | null;
  social: SocialLinks;
  stats: Record<StatKey, CompanyStat>;
  officeAddress: string;
  officeHours: string | null;
  /** Translated label for the office-hours block ([T]); null when unauthored. */
  officeHoursLabel: string | null;
  /** ISO 4217 (default `EUR`). */
  currency: string;
  /** Fallback social image when an entity sets none; null when unset. */
  defaultOgImage: MediaImageData | null;
  avantio: { accountId: string; widgetConfig: Record<string, unknown> };
  /**
   * Buildings-listing display toggles (client feedback B6). When `false` the listing
   * hides the city/region location bar / the total-buildings count respectively —
   * both default off while the portfolio is Lisbon-only.
   */
  showBuildingLocation: boolean;
  showBuildingCount: boolean;
  /** Site icons (Iconoir names with a fixed role: header account, specs, guide templates…). */
  icons: SiteIcons;
}

export type NavLocation = "header" | "footer";

/** A navigation entry; `children` holds the sub-nav / footer-column links. */
export interface NavLink {
  id: string;
  label: string;
  /** Internal path (locale-prefixed at render) or absolute URL. */
  url: string;
  children: NavLink[];
}

export { getGlobals, getNav } from "./server/queries";

/**
 * Avantio booking-engine deep links (client feedback B2). Pure helpers — usable from
 * server components and client islands — so every "search / book" CTA can point at
 * the Avantio engine in the active locale (defaulting to English for locales Avantio
 * does not support). See `./booking`.
 */
export { avantioBookingUrl, AVANTIO_LOCALES, AVANTIO_OWNERS_LOGIN_URL } from "./booking";

/**
 * Avantio availability search bar (external widget, vendor doc `docs/Widget Externo
 * Avantio.pdf`). Server component — fetches the localized form through an ISR-cached reader,
 * hoists the vendor stylesheets into `<head>`, and mounts a client island that replays the
 * widget's scripts. Renders `null` when Avantio is unreachable. Used by S9 pages (Home).
 */
export { AvantioSearchBar } from "./ui/components/avantio-search-bar";

/**
 * The header "Contact" trigger + modal (the leads `ContactForm`, `kind = "contact"`) —
 * a self-contained client island (own open state, own dialog). Exported so other slices
 * can reuse the exact same contact flow elsewhere on the site (e.g. a hero CTA), tagging
 * the lead with their own `source`.
 */
export { ContactDialog } from "./ui/components/contact-dialog";

/** Newsletter band form using the same Brevo HTML destination as the footer modal. */
export { BrevoNewsletterForm } from "./ui/components/brevo-newsletter-form";

/**
 * Backoffice contribution (S12). `settingsAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout; the globals + navigation editors mount
 * under `app/(admin)/admin/(panel)/{settings,navigation}/…` (admin-only). Pure data —
 * safe to import anywhere.
 */
export { settingsAdminScreens } from "./admin/screens";

/** Shared public chrome for authenticated contextual previews. */
export { SiteHeader } from "./ui/site-header";
export { SiteFooter } from "./ui/site-footer";

/** Manual Website fields; other Settings copy retains its existing translation workflow. */
export { WEBSITE_LOCALES, WEBSITE_TARGET_LOCALES, isSettingsWebsiteField } from "./website-locale-types";
export type { WebsiteTranslations } from "./website-locale-types";

/** Manual locale configuration for Book Now and Earn With Us. */
export { NAVIGATION_CTA_LOCALES, NAVIGATION_CTA_KEYS, NAVIGATION_CTAS_FIELD, isSettingsNavigationCtaField, navigationCtaHref } from "./navigation-cta-types";
export type { NavigationCta, NavigationCtas, NavigationCtasByLocale } from "./navigation-cta-types";

export { isSettingsManualLocaleField } from "./manual-locale-fields";

/** Navigation is fixed in code; legacy nav_item rows are retained but not editable. */
export { isFixedNavigationEntity } from "./fixed-navigation";

export { EDITABLE_SITE_ICON_KEYS } from "./site-icons";
export { HOURS_LABEL_LOCALES, HOURS_LABEL_TARGET_LOCALES, HOURS_LABEL_MAX, OFFICE_HOURS_DEFAULT_LABELS, OFFICE_HOURS_DEFAULT_VALUES } from "./hours-label-types";
export type { HoursLabelTranslations } from "./hours-label-types";
export { isSettingsEditorialEntity } from "./manual-locale-fields";
