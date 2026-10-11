import type { MediaImageData } from "@core/media";
import type { BuildMetadataInput } from "@core/seo";
import type { Locale } from "@core/db/columns";
import { routing } from "@/i18n/routing";
import { orMessage } from "../ui/or-message";

/**
 * The pure half of a page route's `generateMetadata` (spec `owners-admin-editor` S2): the
 * `buildMetadata` input for `/<locale><path>` from the page's optional `seo.*` (blank → the
 * i18n fallbacks), its optional OG image, canonical and hreflang alternates for every locale
 * + `x-default` → `<path>`. No `server-only` / DB, so the tests can exercise it directly.
 */
export function seoMetadataInput({
  locale,
  path,
  seo,
  ogImage,
  fallbackTitle,
  fallbackDescription,
}: {
  locale: Locale;
  /** Locale-less route path, e.g. `/owners`. */
  path: string;
  seo: { meta_title?: string; meta_description?: string } | undefined;
  ogImage: MediaImageData | null | undefined;
  fallbackTitle: string;
  fallbackDescription: string;
}): BuildMetadataInput {
  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": path };
  for (const l of routing.locales) languages[l] = `/${l}${path}`;

  return {
    title: orMessage(seo?.meta_title, fallbackTitle),
    description: orMessage(seo?.meta_description, fallbackDescription),
    canonicalPath: `/${locale}${path}`,
    languages,
    images: ogImage
      ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
      : undefined,
  };
}
