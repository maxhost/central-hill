import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { RealEstatePage } from "@slices/pages/ui/real-estate-page";
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

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/real-estate" };
  for (const l of routing.locales) languages[l] = `/${l}/real-estate`;

  return buildMetadata({
    title: "Real Estate Partnerships — Central Hill",
    description:
      "Central Hill Apartments is the hospitality management partner for investment funds, real estate developers, large-scale operators, and corporate clients seeking institutional-grade returns on their assets in Portugal.",
    canonicalPath: `/${locale}/real-estate`,
    languages,
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
