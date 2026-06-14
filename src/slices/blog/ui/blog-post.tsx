import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { JsonLd, blogPostingLd, breadcrumbLd } from "@core/seo";
import { Container, Section } from "@core/ui";
import { getPostBySlug } from "../contract";
import { BodyRenderer } from "./components/body-renderer";
import { PostCard } from "./components/post-card";

function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return null;
  }
}

/** Article detail: header, hero, body blocks, per-post CTA, related posts. */
export async function BlogPost({ locale, slug }: { locale: Locale; slug: string }) {
  setRequestLocale(locale);
  const post = await getPostBySlug(locale, slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const date = formatDate(post.publishedAt, locale);
  const postUrl = `/${locale}/blog/${post.slug}`;

  const ld = [
    blogPostingLd({
      headline: post.title,
      description: post.excerpt,
      url: postUrl,
      image: post.ogImage ? [post.ogImage.url] : undefined,
      datePublished: post.publishedAt ?? undefined,
      authorName: post.author.name,
      publisherName: "Central Hill",
    }),
    breadcrumbLd([
      { name: t("breadcrumb"), url: `/${locale}/blog` },
      { name: post.title, url: postUrl },
    ]),
  ];

  return (
    <main>
      <JsonLd data={ld} />

      <Section as="header" className="pb-0">
        <Container>
          <nav className="text-sm text-ink-soft">
            <Link href={`/${locale}/blog`} className="hover:text-ink">
              {t("breadcrumb")}
            </Link>
            <span className="px-2">/</span>
            <span className="text-ink">{post.category.name}</span>
          </nav>

          <div className="mt-6 flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: post.category.color }}
              aria-hidden
            />
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {post.category.name}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{post.excerpt}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            <span>{post.author.name}</span>
            {date ? <span>· {date}</span> : null}
            {post.readingMinutes ? (
              <span>· {t("readingMinutes", { minutes: post.readingMinutes })}</span>
            ) : null}
          </div>
        </Container>
      </Section>

      {post.cover ? (
        <Section className="py-12">
          <Container>
            <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-surface">
              <MediaImage
                data={post.cover}
                priority
                className="h-full w-full object-cover"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="pt-0">
        <Container>
          <article className="mx-auto max-w-3xl">
            <BodyRenderer body={post.body} media={post.bodyMedia} />

            {post.cta ? (
              <div className="mt-14 rounded-xl border border-line bg-surface p-8 text-center">
                <a
                  href={post.cta.url}
                  className="inline-flex items-center justify-center rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
                >
                  {post.cta.label}
                </a>
              </div>
            ) : null}
          </article>
        </Container>
      </Section>

      {post.related.length ? (
        <Section className="border-t border-line pt-16">
          <Container>
            <h2 className="font-serif text-2xl text-ink">{t("related")}</h2>
            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {post.related.map((r) => (
                <PostCard key={r.id} post={r} locale={locale} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
