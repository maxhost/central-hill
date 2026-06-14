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
  email: string;
  phone: string;
  whatsapp: string | null;
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
