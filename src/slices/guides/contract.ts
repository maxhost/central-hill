/**
 * Public contract of slice `guides` (the ONLY surface other slices may import).
 * "What to Do" city guides — a `guide_page → guide_section → guide_place` tree,
 * scoped to a city (docs/vertical-slices.md → S6, docs/content-briefs.md → 4.2).
 * Consumers: S9 pages (Best-of teaser), S13 seo-geo (sitemap URLs), S14 translation.
 * City data comes from S1 geography via its contract — never by querying its tables.
 */
import type { MediaImageData } from "@core/media";

/** Entity types used for translation/slug keys and cache tags. */
export const GUIDE_PAGE = "guide_page" as const;
export const GUIDE_SECTION = "guide_section" as const;
export const GUIDE_PLACE = "guide_place" as const;

/** Cache tags this slice owns (conventions.md → Cache tags). */
export const GUIDE_TAGS = {
  list: "guide-list",
  page: (id: string) => `guide:${id}`,
} as const;

/** Sub-page type (drives the editorial template). */
export type GuideTemplate =
  | "landing"
  | "eat"
  | "beaches"
  | "events"
  | "secrets"
  | "families"
  | "groups"
  | "travellers"
  | "custom";

/** Section presentation variant. */
export type GuideLayout = "standard" | "with_cta" | "with_media" | "featured_places";

/** €/€€/€€€ price band for a place. */
export type GuidePriceTier = "budget" | "mid" | "premium";

/** Minimal city reference (resolved through geography's contract). */
export interface GuideCityRef {
  id: string;
  /** Per-locale public slug. */
  slug: string;
  name: string;
}

export interface GuidePlace {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  priceTier: GuidePriceTier | null;
  openingHours: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  image: MediaImageData | null;
}

export interface GuideSection {
  id: string;
  layout: GuideLayout;
  title: string;
  /** Rich text (paragraphs), already locale-resolved; null when empty. */
  body: string | null;
  /** Editorial "local tip" callout ([T]); null when unset. */
  localTip: string | null;
  headerImage: MediaImageData | null;
  /** Resolved CTA when both a [T] label and a url are present. */
  cta: { label: string; url: string } | null;
  places: GuidePlace[];
}

export interface GuidePageSummary {
  id: string;
  /** Per-locale public slug of the guide page. */
  slug: string;
  template: GuideTemplate;
  title: string;
  /** Short editorial intro ([T]); null when unauthored. */
  intro: string | null;
  hero: MediaImageData | null;
  city: GuideCityRef;
}

export interface GuidePageDetail extends GuidePageSummary {
  sections: GuideSection[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage: MediaImageData | null;
  /**
   * Per-locale `{city, slug}` path components for hreflang alternates. Only
   * locales where **both** the city slug and the guide-page slug exist are
   * included, so a full URL can always be built without cross-locale guessing.
   */
  alternates: Partial<Record<"en" | "pt" | "es" | "fr", { city: string; slug: string }>>;
}

/** A city and its published guide pages — the shape the index renders. */
export interface GuideCityGroup {
  city: GuideCityRef;
  guides: GuidePageSummary[];
}

/**
 * Place types the guides index features under "Top Recommendations", **in display order**.
 * Matched case-insensitively against `guide_place.category` (free text).
 */
export const RECOMMENDATION_TYPES = ["restaurant", "viewpoint", "beach"] as const;
export type GuideRecommendationType = (typeof RECOMMENDATION_TYPES)[number];

/**
 * One featured place for the index's "Top Recommendations" (`listTopRecommendations`).
 * Always complete: a place without an image, category or address is never returned.
 */
export interface GuideRecommendation {
  /** `guide_place.id` (changes when the seed rebuilds — use only as a React key). */
  id: string;
  type: GuideRecommendationType;
  /** Place name ([T], locale-resolved with `en` fallback). */
  name: string;
  description: string | null;
  /** Raw `category` text as authored (e.g. "Restaurant"); not translated. */
  category: string;
  address: string;
  image: MediaImageData;
  /** Path parts of the guide page the place belongs to: `/${locale}/guides/${citySlug}/${slug}`. */
  guide: { citySlug: string; slug: string };
}

export {
  listGuideCityGroups,
  getGuidePage,
  listGuideParams,
  /**
   * `listTopRecommendations(locale, limit = 3)` — at most one place per
   * `RECOMMENDATION_TYPES` entry, in that order: the first published place (guide → section
   * → place position) whose category matches and that has an image + address. Types with no
   * match are skipped, so the list may be shorter or empty. `unstable_cache`d per
   * locale/limit, tagged `GUIDE_TAGS.list` + `GEO_TAGS.list`.
   */
  listTopRecommendations,
} from "./server/queries";
