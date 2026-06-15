/**
 * JSON-LD builders (kernel — `core/seo`). Per docs/seo-i18n.md: never hand-write
 * JSON-LD in components — use these typed builders so structured data stays
 * consistent and GEO-citable. Emit with the `<JsonLd>` component.
 */

export interface BlogPostingInput {
  headline: string;
  description?: string;
  url: string;
  image?: string[];
  datePublished?: string;
  dateModified?: string;
  authorName: string;
  publisherName?: string;
}

export function blogPostingLd(input: BlogPostingInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    ...(input.image && input.image.length ? { image: input.image } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: { "@type": "Organization", name: input.authorName },
    ...(input.publisherName
      ? { publisher: { "@type": "Organization", name: input.publisherName } }
      : {}),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Site-wide identity (ADR 0020). `Organization` + `LocalBusiness` are emitted once
 * per page (from `globals`) so search/answer engines have a stable NAP for Central
 * Hill. `name`/`url` are required; everything else is included only when present so
 * the payload never carries empty fields.
 */
export interface OrganizationInput {
  name: string;
  /** Absolute site origin (its `@id` anchor). */
  url: string;
  /** Absolute logo URL. */
  logo?: string;
  email?: string;
  telephone?: string;
  /** Profile URLs (social, etc.) for `sameAs`. */
  sameAs?: string[];
}

export function organizationLd(input: OrganizationInput): Record<string, unknown> {
  const sameAs = input.sameAs?.filter(Boolean) ?? [];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${input.url}#organization`,
    name: input.name,
    url: input.url,
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export interface LocalBusinessInput extends OrganizationInput {
  /** Single-line postal address (NAP). */
  address?: string;
  /** Image URL(s) for the listing. */
  image?: string[];
  priceRange?: string;
  /** ISO 4217 currency the business prices in. */
  currency?: string;
}

export function localBusinessLd(input: LocalBusinessInput): Record<string, unknown> {
  const image = input.image?.filter(Boolean) ?? [];
  const sameAs = input.sameAs?.filter(Boolean) ?? [];
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${input.url}#localbusiness`,
    name: input.name,
    url: input.url,
    ...(input.logo ? { logo: input.logo } : {}),
    ...(image.length ? { image } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.address
      ? { address: { "@type": "PostalAddress", streetAddress: input.address } }
      : {}),
    ...(input.priceRange ? { priceRange: input.priceRange } : {}),
    ...(input.currency ? { currenciesAccepted: input.currency } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export interface FaqLdItem {
  question: string;
  answer: string;
}

/** `FAQPage` for any Q&A block (faq groups, marketing FAQ sections). */
export function faqPageLd(items: FaqLdItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/**
 * `LodgingBusiness` for a building/property page (ADR 0020 — resolves the building
 * detail escalation note). Address/geo/amenities/occupancy included only when known.
 */
export interface LodgingBusinessInput {
  name: string;
  url: string;
  description?: string;
  image?: string[];
  address?: string;
  /** Containing place name (e.g. neighbourhood / city). */
  containedInPlace?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Max guest occupancy. */
  occupancy?: number | null;
  amenities?: string[];
}

export function lodgingBusinessLd(input: LodgingBusinessInput): Record<string, unknown> {
  const image = input.image?.filter(Boolean) ?? [];
  const amenities = input.amenities?.filter(Boolean) ?? [];
  const hasGeo = typeof input.latitude === "number" && typeof input.longitude === "number";
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(image.length ? { image } : {}),
    ...(input.address || input.containedInPlace
      ? {
          address: {
            "@type": "PostalAddress",
            ...(input.address ? { streetAddress: input.address } : {}),
            ...(input.containedInPlace ? { addressLocality: input.containedInPlace } : {}),
          },
        }
      : {}),
    ...(hasGeo
      ? { geo: { "@type": "GeoCoordinates", latitude: input.latitude, longitude: input.longitude } }
      : {}),
    ...(typeof input.occupancy === "number" && input.occupancy > 0
      ? { numberOfRooms: input.occupancy }
      : {}),
    ...(amenities.length
      ? {
          amenityFeature: amenities.map((name) => ({
            "@type": "LocationFeatureSpecification",
            name,
          })),
        }
      : {}),
  };
}
