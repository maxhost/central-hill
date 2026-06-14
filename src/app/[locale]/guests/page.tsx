import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getGuestPage } from "@slices/pages/contract";
import { GuestPage } from "@slices/pages/ui/guest-page";

/** ISR: static per locale; on-demand revalidation via the `page:guest` tag. */
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
  const t = await getTranslations({ locale, namespace: "pages" });
  const page = await getGuestPage(locale);

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/guests" };
  for (const l of routing.locales) languages[l] = `/${l}/guests`;

  return buildMetadata({
    title: t("guests.metaTitle"),
    description: t("guests.metaDescription"),
    canonicalPath: `/${locale}/guests`,
    languages,
    images: page?.ogImage
      ? [{ url: page.ogImage.url, width: page.ogImage.width, height: page.ogImage.height, alt: page.ogImage.alt }]
      : undefined,
  });
}

export default async function GuestsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <GuestPage locale={locale} />;
}
