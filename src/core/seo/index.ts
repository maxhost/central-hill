import type { Metadata } from "next";
import type { Locale } from "@core/db/columns";

/**
 * SEO metadata builder (kernel — `core/seo`). Centralizes title/description,
 * canonical + hreflang alternates, Open Graph and Twitter cards per
 * docs/seo-i18n.md. Slices build a page's `Metadata` from their content via this;
 * JSON-LD is built separately with `./jsonld` + `<JsonLd>`.
 */
export interface SeoImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface BuildMetadataInput {
  title: string;
  description?: string;
  /** Localized, locale-prefixed path of this page (its canonical). */
  canonicalPath: string;
  /** Per-locale localized paths for hreflang, plus optional `x-default`. */
  languages?: Partial<Record<Locale | "x-default", string>>;
  images?: SeoImage[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    description,
    canonicalPath,
    languages,
    images,
    type = "website",
    publishedTime,
    modifiedTime,
  } = input;

  const hasImages = Boolean(images && images.length);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type,
      ...(hasImages ? { images } : {}),
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: hasImages ? "summary_large_image" : "summary",
      title,
      description,
      ...(hasImages ? { images: images!.map((i) => i.url) } : {}),
    },
  };
}

export type { BlogPostingInput, BreadcrumbItem } from "./jsonld";
export { blogPostingLd, breadcrumbLd } from "./jsonld";
export { JsonLd } from "./json-ld";
