import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildBuildingsMetadata } from "@slices/pages/contract";
import { BuildingsListing } from "@slices/buildings/ui/buildings-listing";

/**
 * Static per locale (ISR). Content: the published buildings (slice `buildings`, tag
 * `building-list`) + the editable sections of the `buildings` `page_content` row (slice `pages`,
 * tag `page:buildings`); a publish in either busts the page.
 */
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
  return buildBuildingsMetadata(locale);
}

export default async function BuildingsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <BuildingsListing locale={locale} />;
}
