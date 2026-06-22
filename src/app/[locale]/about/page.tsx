import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { AboutPage } from "@slices/pages/ui/about-page";
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

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/about" };
  for (const l of routing.locales) languages[l] = `/${l}/about`;

  return buildMetadata({
    title: "About Us — Central Hill",
    description:
      "Since 2012, Central Hill Apartments has turned properties into high-performing hospitality assets across Portugal — combining deep local knowledge, AI-driven technology, and an uncompromising commitment to quality.",
    canonicalPath: `/${locale}/about`,
    languages,
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
