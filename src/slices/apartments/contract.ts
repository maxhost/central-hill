/**
 * Public contract of slice `apartments` (the ONLY surface other slices may import).
 * The bookable unit — a single apartment inside a building, linked to the Avantio
 * booking engine. Amenities & FAQ live on the **building** (S2), not here. Produces
 * summary/detail read models + cache tags (docs/vertical-slices.md → S3).
 * Consumers: S2 building detail ("Apartments in this Building" grid via
 * `BuildingApartments`), S9 pages, S13 seo-geo, S14 translation.
 * [T] fields (name, badge, description, meta_*) resolve via `core/i18n`.
 */
import type { MediaImageData } from "@core/media";

/** Entity type used for translation/slug keys and cache tags. */
export const APARTMENT = "apartment" as const;

/**
 * Cache tags this slice owns (conventions.md → Cache tags). Per-building listing
 * reads share `APARTMENT_TAGS.list`; a single unit also gets `apartment:<id>`. A
 * publish also busts the parent building's tags (denormalized stats) — see
 * `server/publish.ts`.
 */
export const APARTMENT_TAGS = {
  list: "apartment-list",
  apartment: (id: string) => `apartment:${id}`,
} as const;

/** Avantio booking-engine handles for a unit's "Check availability" CTA. */
export interface ApartmentBooking {
  id: string | null;
  url: string | null;
}

export interface ApartmentSummary {
  id: string;
  /** Per-locale public slug. */
  slug: string;
  /** Parent building id (→ buildings contract). */
  buildingId: string;
  /** [T] unit name (approved target locale, else source `en`). */
  name: string;
  /** [T] optional marketing badge (e.g. "Penthouse"); null when unset. */
  badge: string | null;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  bedsCount: number;
  sizeM2: number | null;
  floor: number | null;
  cover: MediaImageData | null;
  avantio: ApartmentBooking;
}

export interface ApartmentDetail extends ApartmentSummary {
  /** [T] long-form unit description. */
  description: string;
  gallery: MediaImageData[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage: MediaImageData | null;
  /** Per-locale slugs for hreflang alternates. */
  alternateSlugs: Partial<Record<"en" | "pt" | "es" | "fr", string>>;
}

export { listByBuilding, getApartmentBySlug } from "./server/queries";

/**
 * Backoffice contribution (S12). `apartmentsAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout; list/create/edit mount under
 * `app/(admin)/admin/(panel)/apartments/…`. Pure data — safe to import anywhere.
 */
export { apartmentsAdminScreens } from "./admin/screens";
