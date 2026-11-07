import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getServiceBySlug, listServiceParams } from "@slices/services/contract";
import { ServiceDetail } from "@slices/services/ui/service-detail";

/** ISR per service, per locale. Content is DB-driven (`getServiceBySlug`, tagged
 *  `service-list` → a publish busts it); the published per-locale slugs are prerendered,
 *  unknown slugs render on-demand → notFound. */
export const revalidate = 3600;

export async function generateStaticParams() {
  return listServiceParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  setRequestLocale(locale);

  const svc = await getServiceBySlug(locale, slug);
  if (!svc) return {};

  // The slice supplies legacy alternates or only explicitly published locales.
  const languages: Partial<Record<Locale | "x-default", string>> = {};
  for (const [language, localizedSlug] of Object.entries(svc.alternateSlugs)) {
    languages[language as Locale] = `/${language}/services/${localizedSlug}`;
  }
  const sourceSlug = svc.alternateSlugs[routing.defaultLocale];
  if (sourceSlug) languages["x-default"] = `/services/${sourceSlug}`;

  const ogImage = svc.ogImage ?? svc.cover;

  return buildMetadata({
    title: svc.metaTitle ?? `${svc.name} — Central Hill`,
    description: svc.metaDescription ?? svc.excerpt,
    canonicalPath: `/${locale}/services/${slug}`,
    languages,
    images: ogImage
      ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
      : undefined,
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <ServiceDetail locale={locale} slug={slug} />;
}
