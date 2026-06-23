import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getBuildingBySlug, listBuildingParams } from "@slices/buildings/contract";
import { BuildingDetail } from "@slices/buildings/ui/building-detail";
import "../../../mock.css";

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

  // hreflang: each locale's own slug (falls back to this one if a translation's
  // slug is missing) + x-default on the source path.
  const languages: Partial<Record<Locale | "x-default", string>> = {
    "x-default": `/buildings/${slug}`,
  };
  for (const l of routing.locales) {
    languages[l] = `/${l}/buildings/${detail.alternateSlugs[l] ?? slug}`;
  }

  const ogImage = detail.ogImage ?? detail.cover;

  return buildMetadata({
    title: detail.metaTitle ?? `${detail.name} — Central Hill`,
    description: detail.metaDescription ?? detail.teaser,
    canonicalPath: `/${locale}/buildings/${slug}`,
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
