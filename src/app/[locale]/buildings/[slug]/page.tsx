import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getBuildingBySlug, listBuildingParams } from "@slices/buildings/contract";
import { BuildingDetail } from "@slices/buildings/ui/building-detail";

/** ISR per building, per locale. Content is DB-driven (`getBuildingBySlug`); the
 *  published slugs are prerendered, unknown slugs render on-demand → notFound. */
export const revalidate = 3600;

export async function generateStaticParams() {
  return listBuildingParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  setRequestLocale(locale);

  const detail = await getBuildingBySlug(locale, slug);
  if (!detail) return {};

  // Only actual published locale slugs may be advertised as alternates.
  const languages: Partial<Record<Locale | "x-default", string>> = {};
  for (const [language, value] of Object.entries(detail.alternateSlugs)) {
    languages[language as Locale] = `/${language}/buildings/${value}`;
  }
  const defaultLocale = detail.alternateSlugs.en ? "en" : Object.keys(detail.alternateSlugs)[0] as Locale | undefined;
  if (defaultLocale) languages["x-default"] = `/${defaultLocale}/buildings/${detail.alternateSlugs[defaultLocale]}`;

  const ogImage = detail.ogImage ?? detail.cover;

  return buildMetadata({
    title: detail.metaTitle ?? `${detail.name} — Central Hill`,
    description: detail.metaDescription ?? detail.teaser,
    canonicalPath: `/${locale}/buildings/${detail.slug}`,
    languages,
    images: ogImage
      ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
      : undefined,
  });
}

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <BuildingDetail locale={locale} slug={slug} />;
}
