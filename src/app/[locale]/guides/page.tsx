import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { GuidesListing } from "@slices/guides/ui/guides-listing";

/** ISR: static per locale; on-demand revalidation via `guide-list` tag. */
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
  const t = await getTranslations({ locale, namespace: "guides" });

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/guides" };
  for (const l of routing.locales) languages[l] = `/${l}/guides`;

  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    canonicalPath: `/${locale}/guides`,
    languages,
  });
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
