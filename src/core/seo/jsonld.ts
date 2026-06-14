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
