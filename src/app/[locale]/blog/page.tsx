import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { BlogListing } from "@slices/blog/ui/blog-listing";

/** ISR: static per locale; on-demand revalidation via `blog_post-list` tag. */
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
  const t = await getTranslations({ locale, namespace: "blog" });

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/blog" };
  for (const l of routing.locales) languages[l] = `/${l}/blog`;

  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    canonicalPath: `/${locale}/blog`,
    languages,
  });
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <BlogListing locale={locale} />;
}
