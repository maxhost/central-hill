import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { BlogListing } from "@slices/blog/ui/blog-listing";
// No `.mk` markup left; mock.css is still needed for the Iconoir icon font (`PageHeadSearch`'s
// search glyph, `PostMeta`'s clock icon).
import "../../mock.css";

/**
 * Static per locale (ISR). The category chips (`listCategories`), the Featured post
 * (`getFeaturedPost`) and the "From the Journal" grid (`listPosts`, minus the featured post)
 * come from the DB, revalidated by the blog admin publish flow; chip filtering and "Load more"
 * are client-side (no `searchParams`). The newsletter band is i18n copy + the leads slice's
 * `NewsletterForm` (a client island; submitting doesn't affect the static render).
 */
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

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/blog" };
  for (const l of routing.locales) languages[l] = `/${l}/blog`;

  return buildMetadata({
    title: "Blog — Central Hill",
    description:
      "Expert guides, practical tips, and local knowledge for property owners, investors, and anyone navigating the Portuguese short-term rental market.",
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
