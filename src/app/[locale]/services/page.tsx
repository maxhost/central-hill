import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { ServicesListing } from "@slices/services/ui/services-listing";
import "../../mock.css";

/** Static per locale. Content is the embedded mock (no DB). */
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

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/services" };
  for (const l of routing.locales) languages[l] = `/${l}/services`;

  return buildMetadata({
    title: "Guest Services — Central Hill",
    description:
      "A curated collection of services and experiences to make your stay in Lisbon effortless — airport transfers, private tours, a chef at home, grocery delivery and more, arranged by our 24/7 guest team.",
    canonicalPath: `/${locale}/services`,
    languages,
  });
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
