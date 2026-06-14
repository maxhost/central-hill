import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getGuidePage, listGuideParams } from "@slices/guides/contract";
import { GuidePageView } from "@slices/guides/ui/guide-page";

/** ISR: known guide pages prebuilt; unknown render on-demand then cache. */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return listGuideParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; city: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, city, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const guide = await getGuidePage(locale, city, slug);
  if (!guide) return {};

  const languages: Partial<Record<Locale | "x-default", string>> = {};
  for (const [l, alt] of Object.entries(guide.alternates)) {
    languages[l as Locale] = `/${l}/guides/${alt.city}/${alt.slug}`;
  }
  if (guide.alternates.en) {
    languages["x-default"] = `/guides/${guide.alternates.en.city}/${guide.alternates.en.slug}`;
  }

  return buildMetadata({
    title: guide.metaTitle ?? guide.title,
    description: guide.metaDescription ?? guide.intro ?? undefined,
    canonicalPath: `/${locale}/guides/${guide.city.slug}/${guide.slug}`,
    languages,
    images: guide.ogImage
      ? [
          {
            url: guide.ogImage.url,
            width: guide.ogImage.width,
            height: guide.ogImage.height,
            alt: guide.ogImage.alt,
          },
        ]
      : undefined,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string; city: string; slug: string }>;
}) {
  const { locale, city, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <GuidePageView locale={locale} city={city} slug={slug} />;
}
