/**
 * Public contract of slice `buildings` (the ONLY surface other slices may import).
 * The core catalog entity — a Lisbon building with a gallery, building-level
 * amenities & FAQ, denormalized apartment stats, and a location resolved through
 * the geography slice. Produces summary/detail read models + cache tags
 * (docs/vertical-slices.md → S2). Consumers: S3 apartments (parent building),
 * S9 pages (featured portfolio), S13 seo-geo (sitemap URLs), S14 translation.
 * [T] fields (name, headline, teaser, description_*, meta_*) resolve via `core/i18n`.
 */
import type { MediaImageData } from "@core/media";

/** Entity types used for translation/slug keys and cache tags. */
export const BUILDING = "building" as const;
export const BUILDING_FAQ = "building_faq" as const;
export const AMENITY = "amenity" as const;

/**
 * Cache tags this slice owns (conventions.md → Cache tags). Listing/featured reads
 * share `BUILDING_TAGS.list`; a single building detail also gets `building:<id>`.
 * Reads embed geography content (city/neighbourhood labels) so they ALSO carry
 * `GEO_TAGS.list` (geography contract) — a geography publish busts them too.
 */
export const BUILDING_TAGS = {
  list: "building-list",
  building: (id: string) => `building:${id}`,
} as const;

/** A building's location, resolved from the geography slice (names are [T]). */
export interface BuildingLocation {
  id: string;
  slug: string;
  name: string;
}

export interface AmenityRef {
  id: string;
  /** Language-neutral slug (a column, not translated). */
  slug: string;
  /** Icon key for the design-system icon set; null when unset. */
  icon: string | null;
  /** Optional grouping key (e.g. `kitchen`, `comfort`). */
  group: string | null;
  label: string;
}

export interface BuildingFaqItem {
  id: string;
  question: string;
  answer: string;
}

/** Denormalized, recomputed by this slice on apartment publish (data-model.md). */
export interface BuildingStats {
  apartments: number;
  capacity: number;
  beds: number;
}

export interface BuildingSummary {
  id: string;
  /** Per-locale public slug. */
  slug: string;
  name: string;
  /** Short hero headline ([T]). */
  headline: string;
  /** ~180-char card teaser ([T]). */
  teaser: string;
  streetAddress: string | null;
  city: BuildingLocation;
  /** Null when the building is not assigned to a neighbourhood. */
  neighbourhood: BuildingLocation | null;
  cover: MediaImageData | null;
  isNew: boolean;
  isFeatured: boolean;
  stats: BuildingStats;
}

export interface BuildingDetail extends BuildingSummary {
  /** Long-form "The Building" intro ([T]). */
  descriptionIntro: string;
  /** "The Neighbourhood" prose ([T]); null when unauthored. */
  descriptionNeighbourhood: string | null;
  latitude: number | null;
  longitude: number | null;
  gallery: MediaImageData[];
  amenities: AmenityRef[];
  faq: BuildingFaqItem[];
  /** Avantio booking-engine handles for the "Book an apartment" CTA. */
  avantio: { id: string | null; url: string | null };
  metaTitle?: string;
  metaDescription?: string;
  ogImage: MediaImageData | null;
  /** Per-locale slugs for hreflang alternates. */
  alternateSlugs: Partial<Record<"en" | "pt" | "es" | "fr", string>>;
}

/** Server-side filter for `listBuildings` (docs/vertical-slices.md → S2). */
export interface BuildingFilter {
  cityId?: string;
  neighbourhoodId?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export {
  listBuildings,
  getBuildingBySlug,
  getFeaturedBuildings,
  listBuildingParams,
} from "./server/queries";

/**
 * Stats write seam (data-model.md). Buildings can't read the apartment table
 * (golden rule 2), so the apartments admin computes the aggregate over its own
 * table and calls this to persist the denormalized columns on apartment publish.
 */
export { setBuildingStats } from "./server/stats";

/**
 * Admin selector source (S12): `{ id, name }` for every building, any status. The
 * apartments admin uses it to pick a parent building without reading our table.
 */
export { listBuildingOptions } from "./admin/queries";

/**
 * Backoffice contribution (S12). `buildingsAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout; the list/create/edit screens mount
 * under `app/(admin)/admin/(panel)/buildings/…`. Pure data — safe to import anywhere.
 */
export { buildingsAdminScreens } from "./admin/screens";
