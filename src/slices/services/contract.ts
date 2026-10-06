/**
 * Public contract of slice `services` (the ONLY surface other slices may import).
 * Produces guest-service summary/detail read models + cache tags
 * (docs/vertical-slices.md → S5). Consumers: S9 pages (services teaser),
 * S13 seo-geo (sitemap URLs), S14 translation.
 */
import type { MediaImageData } from "@core/media";
import type { ServiceDetailContent } from "./detail";

/** Entity types used for translation/slug keys and cache tags. */
export const SERVICE = "service" as const;
export const SERVICE_CATEGORY = "service_category" as const;

/** Cache tags this slice owns (conventions.md → Cache tags). */
export const SERVICE_TAGS = {
  list: "service-list",
  service: (id: string) => `service:${id}`,
} as const;

/** How a service's primary CTA behaves (data-model.md → services). */
export type ServiceBookingType = "enquiry" | "external" | "none";

export interface ServiceCategoryRef {
  id: string;
  /** Language-neutral slug (a column, not translated). */
  slug: string;
  /** Curated iconoir key (kebab-case), or null. */
  icon: string | null;
  name: string;
}

export interface ServiceSummary {
  id: string;
  /** Per-locale public slug. */
  slug: string;
  name: string;
  excerpt: string;
  category: ServiceCategoryRef;
  cover: MediaImageData | null;
  /** Integer cents, or null when not priced ("from" semantics). */
  priceFrom: number | null;
  /**
   * Satisfaction score 0.0–5.0 (one decimal), or null when unrated. Stored as integer
   * tenths on the row; divided here so consumers render it directly (ADR 0032).
   */
  rating: number | null;
  /** Resolved [T] suffix shown after the price (e.g. "/ person"), or null. */
  priceSuffix: string | null;
  /** Resolved [T] duration label (e.g. "2.5 hours"), or null. */
  durationLabel: string | null;
  bookingType: ServiceBookingType;
}

export interface ServiceDetail extends ServiceSummary {
  /** Rich-text body (paragraphs), already locale-resolved. */
  body: string;
  /**
   * Rich detail sections (highlights, itinerary, options, pricing, extras, partners,
   * notes), locale-resolved; every section empty when the service has none (`./detail`).
   */
  detail: ServiceDetailContent;
  /** Ordered gallery images (excludes the cover). */
  gallery: MediaImageData[];
  /** Resolved CTA when one applies (external link / enquiry target). */
  cta: { label: string; url: string } | null;
  metaTitle?: string;
  metaDescription?: string;
  ogImage: MediaImageData | null;
  /** Per-locale slugs for hreflang alternates. */
  alternateSlugs: Partial<Record<"en" | "pt" | "es" | "fr", string>>;
}

export {
  listServices,
  getServiceBySlug,
  listServiceCategories,
  listServiceParams,
} from "./server/queries";

export {
  EMPTY_DETAIL,
  serviceDetailContent,
  type ExtraOption as DetailExtraOption,
  type ItineraryStep as DetailItineraryStep,
  type OptionGroup as DetailOptionGroup,
  type OptionItem as DetailOptionItem,
  type Partner as DetailPartner,
  type PriceRow as DetailPriceRow,
  type PriceTable as DetailPriceTable,
  type ServiceDetailContent,
} from "./detail";

/**
 * Interim static-content read for the 7 real guest services with a premium detail page
 * today (`ui/service-detail-content.ts` — Airport Transfer, Sintra Tour, Fátima Tour, Boat
 * Tour, Surf Experience, Chef at Home, Luggage Storage). Source content lives in code, not
 * the `service` table, until the backoffice can create/edit this richer shape (pricing
 * tables, itineraries, menus, partner cards) — see README → Deferred. `getServiceContent`/
 * `listServiceSlugs` are what `/[locale]/services/[slug]/page.tsx` renders from; the
 * DB-backed reads above remain for the demo catalogue and other consumers.
 */
export { getServiceContent, listServiceSlugs } from "./ui/service-detail-content";
export type {
  ServiceContent,
  ExtraOption,
  GalleryImage,
  ItineraryStep,
  OptionGroup,
  OptionItem,
  Partner,
  PriceRow,
  PriceTable,
} from "./ui/service-detail-content";

/**
 * Backoffice contribution (S12). `servicesAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout; the category manager + service list +
 * editors mount under `app/(admin)/admin/(panel)/{service-categories,services}/…`.
 * Pure data — safe to import anywhere.
 */
export { servicesAdminScreens } from "./admin/screens";
