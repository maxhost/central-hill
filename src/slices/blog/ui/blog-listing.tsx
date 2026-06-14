import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { Container, Eyebrow, Section } from "@core/ui";
import { getFeaturedPost, listCategories, listPosts } from "../contract";
import type { PostSummary } from "../contract";
import { CategoryTabs } from "./components/category-tabs";
import { NewsletterSignup } from "./components/newsletter-signup";
import { PostCard } from "./components/post-card";

/** Blog listing: hero + featured + category tabs + card grid + newsletter. */
export async function BlogListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  const [posts, featured, categories] = await Promise.all([
    listPosts(locale),
    getFeaturedPost(locale),
    listCategories(locale),
  ]);

  const items = posts.map((p) => ({
    id: p.id,
    category: p.category.slug,
    node: <PostCard post={p} locale={locale} />,
  }));

  return (
    <main>
      <Section as="header" className="pb-0">
        <Container>
          <Eyebrow accent>{t("eyebrow")}</Eyebrow>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        </Container>
      </Section>

      {featured ? (
        <Section className="pt-16">
          <Container>
            <FeaturedPost post={featured} locale={locale} />
          </Container>
        </Section>
      ) : null}

      <Section className="pt-0">
        <Container>
          {items.length ? (
            <CategoryTabs categories={categories} items={items} allLabel={t("all")} />
          ) : (
            <p className="text-ink-soft">{t("empty")}</p>
          )}
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <NewsletterSignup
            eyebrow={t("newsletter.eyebrow")}
            title={t("newsletter.title")}
            description={t("newsletter.description")}
            placeholder={t("newsletter.placeholder")}
            button={t("newsletter.button")}
            success={t("newsletter.success")}
          />
        </Container>
      </Section>
    </main>
  );
}

async function FeaturedPost({ post, locale }: { post: PostSummary; locale: string }) {
  const t = await getTranslations("blog");
  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      className="group grid gap-8 md:grid-cols-2 md:items-center"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-surface">
        {post.cover ? (
          <MediaImage
            data={post.cover}
            priority
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : null}
      </div>
      <div>
        <Eyebrow accent>{t("featured")}</Eyebrow>
        <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">{post.title}</h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">{post.excerpt}</p>
        <span className="mt-6 inline-block text-sm font-medium text-accent transition-colors group-hover:text-accent-deep">
          {t("readArticle")} →
        </span>
      </div>
    </Link>
  );
}
