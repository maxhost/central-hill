import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getOwnersPage } from "@slices/pages/contract";
import { OwnersPage } from "@slices/pages/ui/owners-page";

/** ISR: static per locale; on-demand revalidation via the `page:owners` tag. */
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
  const page = await getOwnersPage(locale);

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/owners" };
  for (const l of routing.locales) languages[l] = `/${l}/owners`;

  return buildMetadata({
    title: t("owners.metaTitle"),
    description: t("owners.metaDescription"),
    canonicalPath: `/${locale}/owners`,
    languages,
    images: page?.ogImage
      ? [{ url: page.ogImage.url, width: page.ogImage.width, height: page.ogImage.height, alt: page.ogImage.alt }]
      : undefined,
  });
}

export default async function OwnersRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <OwnersPage locale={locale} />;
}
