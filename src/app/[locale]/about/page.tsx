import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getAboutPage } from "@slices/pages/contract";
import { AboutPage } from "@slices/pages/ui/about-page";

/** ISR: static per locale; on-demand revalidation via the `page:about` tag. */
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
  const page = await getAboutPage(locale);

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/about" };
  for (const l of routing.locales) languages[l] = `/${l}/about`;

  return buildMetadata({
    title: t("about.metaTitle"),
    description: t("about.metaDescription"),
    canonicalPath: `/${locale}/about`,
    languages,
    images: page?.ogImage
      ? [{ url: page.ogImage.url, width: page.ogImage.width, height: page.ogImage.height, alt: page.ogImage.alt }]
      : undefined,
  });
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
