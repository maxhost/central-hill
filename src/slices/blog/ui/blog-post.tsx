import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { JsonLd, blogPostingLd, breadcrumbLd } from "@core/seo";
import {
  AsideCta,
  DetailLayout,
  DetailTitle,
  MosaicGallery,
  SectionHead,
  StickyAside,
  TocList,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { getBlogAsideCta } from "@slices/pages/contract";
import { SITE_ICON_DEFAULTS, getGlobals } from "@slices/settings/contract";
import { getPostBySlug } from "../contract";
import { BodyRenderer, type CalloutChrome } from "./components/body-renderer";
import { headingIds, tocItems } from "./components/headings";
import { JournalCard } from "./components/journal-card";
import { NewsletterSignup } from "./components/newsletter-signup";

/**
 * Blog post detail (`/[locale]/blog/[slug]`) — the approved `mock/blog-post.html`: the service
 * detail skeleton (`services/ui/service-detail.tsx`) applied to an article, built from `core/ui`
 * components and DB-driven through the slice contract (`getPostBySlug`, ISR-cached and tagged
 * `blog_post-list`). DB text renders as React text (escaped). UI copy: `blog.*`.
 *
 * Top to bottom:
 * 1. `DetailTitle`: breadcrumb Home / Blog / category (→ the listing), eyebrow = category,
 *    `<h1>` = title, tagline = excerpt, meta = author (semibold) · `published_date` icon + long
 *    date · `reading_time` icon + "N min read".
 * 2. Cover — `MosaicGallery adaptive` with the single cover (the `n1` layout); omitted without one.
 * 3. `DetailLayout`:
 *    - main: the mobile `TocList collapsible`, the article (`BodyRenderer`, the mock's
 *      `.article` prose) and the byline (initial disc, name, author bio or
 *      `blog.bylineFallback`);
 *    - aside: `StickyAside` with the `TocList` (hidden ≤980px) and the `AsideCta` from
 *      `getBlogAsideCta` (Pages → Blog in the backoffice). A post's own `cta` replaces only the
 *      button (label + href); the eyebrow/title/body stay the global ones.
 *    The TOC lists the body's h2 (h3 as sub-entries); `headingIds` gives both the TOC and the
 *    renderer the same anchor ids. No headings → no TOC, the aside is just the CTA.
 * 4. `NewsletterSignup`, as on the listing.
 * 5. Related posts — `SectionHead` + the listing's `JournalCard` grid (same columns and gaps).
 *
 * JSON-LD: BlogPosting + BreadcrumbList (Home / Blog / post).
 */

const WRAP = "mx-auto max-w-[1240px] px-[28px]";
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const COVER_SIZES = "(max-width: 1240px) 100vw, 1184px";

function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return null;
  }
}

const META_TAG =
  "inline-flex items-center gap-[7px] text-ink-soft [&_svg]:block [&_svg]:size-4 [&_svg]:text-accent-deep";

export async function BlogPost({ locale, slug }: { locale: Locale; slug: string }) {
  setRequestLocale(locale);
  const post = await getPostBySlug(locale, slug);
  if (!post) notFound();

  const [t, globals, asideCta] = await Promise.all([
    getTranslations("blog"),
    getGlobals(locale),
    getBlogAsideCta(locale),
  ]);
  // Site icons (Settings → "Site icons", ADR 0034 amendment 2).
  const icons = globals?.icons ?? SITE_ICON_DEFAULTS;

  const date = formatDate(post.publishedAt, locale);
  const postUrl = `/${locale}/blog/${post.slug}`;
  const blogUrl = `/${locale}/blog`;

  const ids = headingIds(post.body);
  const toc = tocItems(post.body, ids);
  const tocTitle = t("toc");

  const callouts: CalloutChrome = {
    tip: { icon: icons.callout_tip, label: t("callout.tip") },
    info: { icon: icons.callout_info, label: t("callout.info") },
    warning: { icon: icons.callout_warning, label: t("callout.warning") },
    note: { icon: icons.callout_note, label: t("callout.note") },
  };

  const cta = post.cta ? { label: post.cta.label, href: post.cta.url } : asideCta.cta;
  const related = post.related.filter((r) => r.slug);

  const ld = [
    blogPostingLd({
      headline: post.title,
      description: post.excerpt,
      url: postUrl,
      image: post.ogImage ? [post.ogImage.url] : post.cover ? [post.cover.url] : undefined,
      datePublished: post.publishedAt ?? undefined,
      authorName: post.author.name,
      publisherName: "Central Hill",
    }),
    breadcrumbLd([
      { name: t("home"), url: `/${locale}` },
      { name: t("breadcrumb"), url: blogUrl },
      { name: post.title, url: postUrl },
    ]),
  ];

  // ---- title meta line -----------------------------------------------------------------------
  const meta: ReactNode[] = [<span key="author" className="font-semibold">{post.author.name}</span>];
  if (date) {
    meta.push(
      <span className={META_TAG}>
        <Icon name={icons.published_date} />
        <time dateTime={post.publishedAt ?? undefined}>{date}</time>
      </span>,
    );
  }
  if (post.readingMinutes) {
    meta.push(
      <span className={META_TAG}>
        <Icon name={icons.reading_time} />
        {t("readingMinutes", { minutes: post.readingMinutes })}
      </span>,
    );
  }

  return (
    <>
      <JsonLd data={ld} />

      {/* 1 · title block */}
      <DetailTitle
        breadcrumbLabel={t("breadcrumbLabel")}
        crumbs={[
          { label: t("home"), href: `/${locale}` },
          { label: t("breadcrumb"), href: blogUrl },
          { label: post.category.name, href: blogUrl },
        ]}
        eyebrow={post.category.name}
        title={post.title}
        tagline={post.excerpt || undefined}
        meta={meta}
      />

      {/* 2 · cover */}
      {post.cover ? (
        <div className={WRAP}>
          <MosaicGallery adaptive images={[<MediaImage key="cover" data={post.cover} sizes={COVER_SIZES} priority />]} />
        </div>
      ) : null}

      {/* 3 · article + sticky aside */}
      <DetailLayout
        main={
          <>
            {toc.length ? <TocList collapsible title={tocTitle} items={toc} icon={<Icon name={icons.table_of_contents} />} /> : null}
            <article className="max-w-[68ch]">
              <BodyRenderer
                body={post.body}
                media={post.bodyMedia}
                ids={ids}
                bulletIcon={icons.list_bullet}
                callouts={callouts}
              />
              <div className="mt-14 flex items-center gap-4 border-t border-line pt-[30px]">
                <div
                  aria-hidden
                  className="grid size-[52px] flex-none place-items-center rounded-full bg-feature font-serif text-xl text-feature-accent"
                >
                  {post.author.name.trim().charAt(0).toUpperCase()}
                </div>
                <div className="leading-[1.6]">
                  <b className="block text-[15px] font-semibold text-ink">{post.author.name}</b>
                  <span className="text-[13.5px] text-ink-soft">{post.author.bio ?? t("bylineFallback")}</span>
                </div>
              </div>
            </article>
          </>
        }
        aside={
          <StickyAside label={tocTitle}>
            {toc.length ? (
              <TocList
                title={tocTitle}
                items={toc}
                icon={<Icon name={icons.table_of_contents} />}
                className="max-[980px]:hidden"
              />
            ) : null}
            <AsideCta
              eyebrow={asideCta.eyebrow}
              title={asideCta.title}
              body={asideCta.body}
              cta={cta}
              divided={toc.length > 0}
            />
          </StickyAside>
        }
      />

      {/* 4 · newsletter */}
      <NewsletterSignup
        eyebrow={t("newsletter.eyebrow")}
        title={t("newsletter.title")}
        description={t("newsletter.description")}
        source="blog"
      />

      {/* 5 · related */}
      {related.length ? (
        <section className={SECTION_SHELL}>
          <div className={WRAP}>
            <SectionHead eyebrow={t("relatedEyebrow")} headline={t("related")} flush className="mb-[34px]" />
            <div className="grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3">
              {related.map((r) => (
                <JournalCard
                  key={r.id}
                  post={r}
                  locale={locale}
                  readingTimeLabel={r.readingMinutes ? t("readingMinutes", { minutes: r.readingMinutes }) : null}
                  readingTimeIcon={icons.reading_time}
                  readLabel={t("readArticle")}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
