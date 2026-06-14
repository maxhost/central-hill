/**
 * Public contract of slice `geography` (the ONLY surface other slices may import).
 * Produces the catalog taxonomy read models — `CityRef`, `NeighbourhoodRef` — plus
 * cache tags (docs/vertical-slices.md → S1). Geography has **no public routes of its
 * own**: it is a taxonomy consumed by S2 buildings (filters), S6 guides (city scope)
 * and S9 pages. [T] fields (`name`, `intro`) resolve via `core/i18n`.
 */
import type { MediaImageData } from "@core/media";

/** Entity types used for translation/slug keys and cache tags. */
export const CITY = "city" as const;
export const NEIGHBOURHOOD = "neighbourhood" as const;

/**
 * Cache tags this slice owns (conventions.md → Cache tags). Taxonomy reads are
 * small and change rarely, so all list reads share `GEO_TAGS.list`; a single city
 * also gets `city:<id>`. **Consumers that embed city/neighbourhood content in their
 * own cached reads should add `GEO_TAGS.list` to those reads' tags** so a geography
 * publish busts them too (buildings cards, guide heroes, page teasers).
 */
export const GEO_TAGS = {
  list: "city-list",
  city: (id: string) => `city:${id}`,
} as const;

export interface CityRef {
  id: string;
  /** Per-locale public slug. */
  slug: string;
  name: string;
  /** ISO 3166-1 alpha-2 (default `PT`). */
  country: string;
  /** Short editorial intro ([T]); null when unauthored. */
  intro: string | null;
  /** Hero image ([T] alt resolved); null when unset. */
  hero: MediaImageData | null;
}

export interface NeighbourhoodRef {
  id: string;
  cityId: string;
  /** Per-locale public slug. */
  slug: string;
  name: string;
}

export {
  listCities,
  getCityBySlug,
  listNeighbourhoods,
  getNeighbourhoodBySlug,
  listCityParams,
} from "./server/queries";

/**
 * Backoffice contribution (S12). `geographyAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout; the city list + editor (with inline
 * neighbourhoods) mount under `app/(admin)/admin/(panel)/cities/…`. Pure data — safe
 * to import anywhere.
 */
export { geographyAdminScreens } from "./admin/screens";
