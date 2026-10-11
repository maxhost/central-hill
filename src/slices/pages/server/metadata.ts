import "server-only";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { orMessage } from "../ui/or-message";
import { seoMetadataInput } from "./metadata-input";
import { getHomePage, getOwnersPage } from "./queries";

/**
 * `generateMetadata` for the Home route (`src/app/[locale]/page.tsx`), spec
 * `home-admin-editor` S3. Title/description come from the page's `seo.*` (resolved for the
 * locale) and fall back to `pages.home.metaTitle` / `metaDescription` when blank, so a row
 * without `seo` yields exactly the metadata the route built before. Canonical `/<locale>`,
 * hreflang alternates for every locale + `x-default` → `/`, and the optional OG image override.
 */
export async function buildHomeMetadata(locale: Locale): Promise<Metadata> {
  const [t, page] = await Promise.all([
    getTranslations({ locale, namespace: "pages" }),
    getHomePage(locale),
  ]);
  const seo = page?.content.seo;

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/" };
  for (const l of routing.locales) languages[l] = `/${l}`;

  return buildMetadata({
    title: orMessage(seo?.meta_title, t("home.metaTitle")),
    description: orMessage(seo?.meta_description, t("home.metaDescription")),
    canonicalPath: `/${locale}`,
    languages,
    images: page?.ogImage
      ? [
          {
            url: page.ogImage.url,
            width: page.ogImage.width,
            height: page.ogImage.height,
            alt: page.ogImage.alt,
          },
        ]
      : undefined,
  });
}

/**
 * `generateMetadata` for the Owners route (`src/app/[locale]/owners/page.tsx`), spec
 * `owners-admin-editor` S2 — the same output as {@link buildHomeMetadata}'s shape. Title /
 * description come from the page's `seo.*` and fall back to `pages.owners.metaTitle` /
 * `metaDescription` when blank. Canonical `/<locale>/owners`, hreflang alternates for every
 * locale + `x-default` → `/owners`, and the optional OG image override (via the pure
 * `seoMetadataInput`).
 */
export async function buildOwnersMetadata(locale: Locale): Promise<Metadata> {
  const [t, page] = await Promise.all([
    getTranslations({ locale, namespace: "pages" }),
    getOwnersPage(locale),
  ]);
  return buildMetadata(
    seoMetadataInput({
      locale,
      path: "/owners",
      seo: page?.content.seo,
      ogImage: page?.ogImage,
      fallbackTitle: t("owners.metaTitle"),
      fallbackDescription: t("owners.metaDescription"),
    }),
  );
}
