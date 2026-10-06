import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { ServicesListing } from "@slices/services/ui/services-listing";
// Only for the Iconoir stylesheet that `mock.css` `@import`s (card icons, How It Works); no
// `.mk` markup is left on this page (parked ADR 0033).
import "../../mock.css";

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

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/services" };
  for (const l of routing.locales) languages[l] = `/${l}/services`;

  const t = await getTranslations({ locale, namespace: "services" });

  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
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
