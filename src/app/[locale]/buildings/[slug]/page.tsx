import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { BuildingDetail } from "@slices/buildings/ui/building-detail";
import "../../../mock.css";

/** Static per locale. Content is the embedded mock (no DB) — the single example
 *  building is rendered for any slug. */
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale, slug: "sample" }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  setRequestLocale(locale);

  const languages: Partial<Record<Locale | "x-default", string>> = {
    "x-default": `/buildings/${slug}`,
  };
  for (const l of routing.locales) languages[l] = `/${l}/buildings/${slug}`;

  return buildMetadata({
    title: "Large Bairro Alto View — Central Hill",
    description:
      "Large Bairro Alto View by Central Hill — six designer apartments on Rua da Alegria in the heart of Lisbon, between Príncipe Real and Bairro Alto. Real-time booking via Avantio.",
    canonicalPath: `/${locale}/buildings/${slug}`,
    languages,
  });
}

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <BuildingDetail locale={locale} slug={slug} />;
}
