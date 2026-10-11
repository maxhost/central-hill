import "server-only";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { orMessage } from "../ui/or-message";
import { getHomePage } from "./queries";

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
