import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getBuildingBySlug, listBuildingParams } from "@slices/buildings/contract";
import { BuildingDetail } from "@slices/buildings/ui/building-detail";

/** ISR: known slugs prebuilt; unknown render on-demand then cache. */
export const revalidate = 3600;
export const dynamicParams = true;

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

  const b = await getBuildingBySlug(locale, slug);
  if (!b) return {};

  const languages: Partial<Record<Locale | "x-default", string>> = {};
  for (const [l, s] of Object.entries(b.alternateSlugs)) {
    languages[l as Locale] = `/${l}/buildings/${s}`;
  }
  if (b.alternateSlugs.en) languages["x-default"] = `/buildings/${b.alternateSlugs.en}`;

  return buildMetadata({
    title: b.metaTitle ?? b.name,
    description: b.metaDescription ?? b.teaser,
    canonicalPath: `/${locale}/buildings/${b.slug}`,
    languages,
    images: b.ogImage
      ? [{ url: b.ogImage.url, width: b.ogImage.width, height: b.ogImage.height, alt: b.ogImage.alt }]
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
