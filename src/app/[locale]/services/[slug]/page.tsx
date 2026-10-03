import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@core/seo";
import { getServiceContent, listServiceSlugs } from "@slices/services/contract";
import { ServiceDetail } from "@slices/services/ui/service-detail";
import "../../../mock.css";

/**
 * Static per (locale, slug) — content is the embedded static catalogue (no DB), same slug
 * across every locale for now (see `service-detail-content.ts`).
 */
export const revalidate = 3600;

export function generateStaticParams() {
  const slugs = listServiceSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const svc = getServiceContent(slug);
  if (!svc) return {};

  const languages: Partial<Record<(typeof routing.locales)[number] | "x-default", string>> = {
    "x-default": `/services/${slug}`,
  };
  for (const l of routing.locales) languages[l] = `/${l}/services/${slug}`;

  return buildMetadata({
    title: `${svc.name} — Central Hill`,
    description: svc.tagline,
    canonicalPath: `/${locale}/services/${slug}`,
    languages,
    images: [{ url: svc.heroImage.src, width: 1900, height: 1080, alt: svc.heroImage.alt }],
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
