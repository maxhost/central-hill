import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { getPostBySlug, listPostParams } from "@slices/blog/contract";
import { BlogPost } from "@slices/blog/ui/blog-post";

/** ISR: known slugs prebuilt; unknown render on-demand then cache. */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return listPostParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const post = await getPostBySlug(locale, slug);
  if (!post) return {};

  const languages: Partial<Record<Locale | "x-default", string>> = {};
  for (const [l, s] of Object.entries(post.alternateSlugs)) {
    languages[l as Locale] = `/${l}/blog/${s}`;
  }
  if (post.alternateSlugs.en) languages["x-default"] = `/blog/${post.alternateSlugs.en}`;

  return buildMetadata({
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    canonicalPath: `/${locale}/blog/${post.slug}`,
    languages,
    images: post.ogImage
      ? [
          {
            url: post.ogImage.url,
            width: post.ogImage.width,
            height: post.ogImage.height,
            alt: post.ogImage.alt,
          },
        ]
      : undefined,
    type: "article",
    publishedTime: post.publishedAt ?? undefined,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <BlogPost locale={locale} slug={slug} />;
}
