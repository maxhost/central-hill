import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getRealEstatePage } from "@slices/pages/contract";
import { RealEstatePage } from "@slices/pages/ui/real-estate-page";

/** ISR: static per locale; on-demand revalidation via the `page:real_estate` tag. */
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
  const page = await getRealEstatePage(locale);

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/real-estate" };
  for (const l of routing.locales) languages[l] = `/${l}/real-estate`;

  return buildMetadata({
    title: t("realEstate.metaTitle"),
    description: t("realEstate.metaDescription"),
    canonicalPath: `/${locale}/real-estate`,
    languages,
    images: page?.ogImage
      ? [{ url: page.ogImage.url, width: page.ogImage.width, height: page.ogImage.height, alt: page.ogImage.alt }]
      : undefined,
  });
}

export default async function RealEstateRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <RealEstatePage locale={locale} />;
}
