import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildServicesMetadata } from "@slices/pages/contract";
import { ServicesListing } from "@slices/services/ui/services-listing";

/**
 * Static per locale (ISR). Copy is the `services.*` messages; the cards are the published
 * services, cached under `SERVICE_TAGS.list`, which the services publish flow revalidates.
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

  return buildServicesMetadata(locale);
}

export default async function ServicesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <ServicesListing locale={locale} />;
}
