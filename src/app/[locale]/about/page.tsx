import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildAboutMetadata } from "@slices/pages/contract";
import { AboutPage } from "@slices/pages/ui/about-page";

/**
 * Static per locale (ISR). Content is the `about` page_content row; office details come from
 * cached `getGlobals` (tag `globals`). Metadata: the page's `seo.*` with the `pages.about.*`
 * fallback (spec about-admin-editor S1).
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

  return buildAboutMetadata(locale);
}

export default async function AboutRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <AboutPage locale={locale} />;
}
