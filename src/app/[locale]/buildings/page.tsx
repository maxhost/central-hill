import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { BuildingsListing } from "@slices/buildings/ui/buildings-listing";
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

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/buildings" };
  for (const l of routing.locales) languages[l] = `/${l}/buildings`;

  return buildMetadata({
    title: "Buildings — Central Hill",
    description:
      "Explore Central Hill's curated portfolio of exceptional buildings in Lisbon's most vibrant and iconic neighbourhoods — each handpicked for location, character, and guest experience.",
    canonicalPath: `/${locale}/buildings`,
    languages,
  });
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
