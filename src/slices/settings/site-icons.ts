import type { IconName } from "@core/ui/icons/names";
import type { GuideTemplate } from "@slices/guides/contract";

/**
 * Site icons: the Iconoir icons with a fixed role on the site rather than a row of their own
 * (ADR 0034, amendment 2). Staff pick them in Settings → "Site icons"; `company_settings.site_icons`
 * stores the chosen names and the read model fills any missing or unknown key from here. The
 * defaults are what the pages drew before the icons became editable.
 *
 * Client-safe (no runtime imports), so the backoffice form can list the keys.
 */
export const SITE_ICON_DEFAULTS = {
  /** Header: account link (Avantio owner login), contact button, language switcher. */
  account: "user",
  contact: "mail",
  language: "language",
  /** Location pin: guide places and the guides city chip. */
  location: "map-pin",
  /** Reading time in the blog post meta. */
  reading_time: "clock",
  /** Search box in a page head (blog). */
  search: "search",
  /** Apartment card specs (building detail). */
  spec_bedrooms: "house-rooms",
  spec_beds: "bed",
  spec_guests: "user",
  spec_size: "maximize",
  /** Services listing: the three "how it works" steps. */
  services_how_1: "chat-bubble",
  services_how_2: "home-simple",
  services_how_3: "headset",
  /** Service detail: "What's included" lines, title badges, booking-card note, "Show all photos". */
  service_included: "check-circle",
  service_badge: "shield-check",
  service_note: "shield-check",
  service_photos: "view-grid",
  /** Service detail "Good to know" columns. */
  know_included: "check-circle",
  know_cancellation: "calendar",
  know_practical: "info-circle",
  /** Guide card icon, per editorial template. */
  guide_landing: "bank",
  guide_eat: "pizza-slice",
  guide_beaches: "sea-waves",
  guide_events: "music-double-note",
  guide_secrets: "binocular",
  guide_families: "group",
  guide_groups: "community",
  guide_travellers: "compass",
  guide_custom: "compass",
} as const satisfies Record<
  | "account" | "contact" | "language" | "location" | "reading_time" | "search"
  | `services_how_${1 | 2 | 3}`
  | `service_${"included" | "badge" | "note" | "photos"}`
  | `know_${"included" | "cancellation" | "practical"}`
  | `spec_${"bedrooms" | "beds" | "guests" | "size"}` | `guide_${GuideTemplate}`,
  IconName
>;

export type SiteIconKey = keyof typeof SITE_ICON_DEFAULTS;

/** Every site icon resolved to an Iconoir name. */
export type SiteIcons = Record<SiteIconKey, string>;

export const SITE_ICON_KEYS = Object.keys(SITE_ICON_DEFAULTS) as SiteIconKey[];
