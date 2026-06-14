import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getServiceBySlug, listServiceParams } from "@slices/services/contract";
import { ServiceDetail } from "@slices/services/ui/service-detail";

/** ISR: known slugs prebuilt; unknown render on-demand then cache. */
export const revalidate = 3600;
export const dynamicParams = true;

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

  const svc = await getServiceBySlug(locale, slug);
  if (!svc) return {};

  const languages: Partial<Record<Locale | "x-default", string>> = {};
  for (const [l, s] of Object.entries(svc.alternateSlugs)) {
    languages[l as Locale] = `/${l}/services/${s}`;
  }
  if (svc.alternateSlugs.en) languages["x-default"] = `/services/${svc.alternateSlugs.en}`;

  return buildMetadata({
    title: svc.metaTitle ?? svc.name,
    description: svc.metaDescription ?? svc.excerpt,
    canonicalPath: `/${locale}/services/${svc.slug}`,
    languages,
    images: svc.ogImage
      ? [
          {
            url: svc.ogImage.url,
            width: svc.ogImage.width,
            height: svc.ogImage.height,
            alt: svc.ogImage.alt,
          },
        ]
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
