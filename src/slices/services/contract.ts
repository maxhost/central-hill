/**
 * Public contract of slice `services` (the ONLY surface other slices may import).
 * Produces guest-service summary/detail read models + cache tags
 * (docs/vertical-slices.md → S5). Consumers: S9 pages (services teaser),
 * S13 seo-geo (sitemap URLs), S14 translation.
 */
import type { MediaImageData } from "@core/media";

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
  /** Resolved [T] duration label (e.g. "2.5 hours"), or null. */
  durationLabel: string | null;
  bookingType: ServiceBookingType;
}

export interface ServiceDetail extends ServiceSummary {
  /** Rich-text body (paragraphs), already locale-resolved. */
  body: string;
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

/**
 * Backoffice contribution (S12). `servicesAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout; the category manager + service list +
 * editors mount under `app/(admin)/admin/(panel)/{service-categories,services}/…`.
 * Pure data — safe to import anywhere.
 */
export { servicesAdminScreens } from "./admin/screens";
