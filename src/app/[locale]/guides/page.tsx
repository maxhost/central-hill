import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildGuidesMetadata } from "@slices/pages/contract";
import { GuidesListing } from "@slices/guides/ui/guides-listing";

/** Static per locale; both card grids are DB-driven (tag-revalidated via `listGuideCityGroups` / `listTopRecommendations`). */
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  setRequestLocale(locale);

  return buildGuidesMetadata(locale);
}

export default async function GuidesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <GuidesListing locale={locale} />;
}
