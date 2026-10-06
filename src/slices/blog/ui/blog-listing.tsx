import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { PageHead, PageHeadSearch, SectionHead } from "@core/ui";
import { getFeaturedPost, listCategories, listPosts } from "../contract";
import { CategoryFilterItem, CategoryFilterProvider, CategoryLoadMore, CategoryTabs } from "./components/category-tabs";
import { FeaturedPost } from "./components/featured-post";
import { JournalCard } from "./components/journal-card";
import { NewsletterSignup } from "./components/newsletter-signup";

/**
 * Blog listing — the approved `mock/blog.html` inside the live app shell.
 * The header band (eyebrow, `<h1>`, lede, search field) is the `core/ui` `PageHead` +
 * `PageHeadSearch`, rendered as JSX with i18n copy (`blog.eyebrow|title|intro|searchPlaceholder|
 * searchLabel`). Below it, the **category tabs** are JSX too and
 * **DB-driven**: the slice's `CategoryTabs` (`core/ui`'s `ChipBar`, plain + centred) fed by
 * `listCategories(locale)`, which is `unstable_cache`d per locale and tagged `blog_post-list`,
 * so a category save/delete in the backoffice (`revalidateBlogList`) refreshes the page. "All"
 * (`blog.all`) + one chip per category, in admin `position` order, with the translated name and
 * the category colour as the swatch (only if it's a valid `#hex`). The chips **filter** the
 * "From the Journal" grid client-side (`CategoryFilterProvider` around tabs + Featured + grid,
 * each card in a `CategoryFilterItem`; see `category-tabs.tsx`). Next, the **"Featured"
 * section** is JSX and **DB-driven** as well: `core/ui`'s `SectionHead` (eyebrow only,
 * `blog.featured`) over the slice's `FeaturedPost` card, fed by `getFeaturedPost(locale)` (the
 * most recently published post flagged `is_featured`; `unstable_cache`d per locale, tagged
 * `blog_post-list`, so publishing/unfeaturing a post in the backoffice refreshes it). No
 * featured post → the whole section is omitted. Then **"From the Journal"** (JSX, DB):
 * `SectionHead` (`blog.latestEyebrow` + `blog.latestTitle`) over a 3/2/1 grid of the slice's
 * `JournalCard`s, fed by `listPosts(locale)` (published, newest `published_at` first; cached +
 * tagged like the others) minus the featured post, with a client "Load more"
 * (`CategoryLoadMore`, `blog.loadMore`) that only appears when there are more than
 * `JOURNAL_PAGE_SIZE` cards. Last, the **newsletter** band (JSX, i18n, wired): the slice's
 * `NewsletterSignup` — `core/ui`'s `CenteredCtaBand` with the leads slice's `NewsletterForm`
 * (`theme="dark"`, `source="blog"`) in its action slot, copy from `blog.newsletter.eyebrow|title|
 * description` (form labels from `leads.*`); submitting creates a `newsletter` lead. The page is
 * now **fully componentised** — no `.mk` subtree, no raw mock markup or page styles. The real
 * header/footer come from the app layout. (The search field is inert until blog search lands.)
 */

/**
 * Cards shown on "All" before "Load more" — the mock's 3 full rows of the 3-column grid. All
 * posts are still server-rendered (in the HTML, crawlable); the rest are revealed client-side
 * a page at a time, so the page needs no `searchParams` and stays ISR.
 */
const JOURNAL_PAGE_SIZE = 9;

// Standard page shell (Guides/Real Estate): the mock's `.mk section` padding + 84px scroll margin,
// and the `.wrap` 1240px/28px column.
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";

/**
 * Blog listing: `PageHead` header (JSX, i18n) + category tabs (JSX, DB) + featured (JSX, DB) +
 * "From the Journal" grid (JSX, DB) + newsletter band (JSX, i18n, leads form). The search field is
 * inert: no `action`, and this page never reads `searchParams` (that would make it dynamic), so
 * submitting just reloads `?q=…`. The tabs section reproduces the mock's
 * `<section style="padding-top:48px;padding-bottom:0">`; its 1240px/28px column comes from
 * `ChipBar` itself. The featured section reproduces `<section style="padding-top:52px;
 * padding-bottom:0">` + `.wrap` + a `28px`-gap `.sec-head` (`SectionHead` `flush` +
 * `mb-[28px]`); the journal section the default `.mk section` padding + `.wrap` + a `34px`-gap
 * `.sec-head` (`flush` + `mb-[34px]`) over the Guides/Buildings listing grid. The page has no
 * `.mk` subtree (see `ChipBar`'s / `SectionHead`'s docstrings for why they must sit outside one).
 *
 * The grid **excludes the featured post by id** (the one `getFeaturedPost` returned), not every
 * `isFeatured` post: if editors flag several, only the newest is shown as Featured, and the
 * older flagged ones must still appear in the grid rather than vanish from the page.
 *
 * The featured card is deliberately **not** wrapped in `CategoryFilterItem`: it is the
 * editor's pick, shown above the filterable "From the Journal" grid, so it stays visible
 * whatever category chip is selected. It sits inside the provider only because the provider
 * must enclose both the tabs (above it) and the grid (below it).
 */
export async function BlogListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [t, categories, featured, posts] = await Promise.all([
    getTranslations("blog"),
    listCategories(locale),
    getFeaturedPost(locale),
    listPosts(locale),
  ]);
  // `listPosts` is already newest-first (`published_at desc`). Posts without a slug can't link.
  const journal = posts.filter((p) => p.id !== featured?.id && p.slug);

  return (
    <>
      <PageHead eyebrow={t("eyebrow")} headline={t("title")} intro={t("intro")}>
        <PageHeadSearch placeholder={t("searchPlaceholder")} label={t("searchLabel")} />
      </PageHead>
      <CategoryFilterProvider pageSize={JOURNAL_PAGE_SIZE}>
        <section className="pt-[48px]">
          <CategoryTabs
            allLabel={t("all")}
            categories={categories.map((c) => ({ slug: c.slug, name: c.name, color: c.color }))}
          />
        </section>
        {featured ? (
          <section className="pt-[52px]">
            <div className="mx-auto max-w-[1240px] px-[28px]">
              <SectionHead eyebrow={t("featured")} flush className="mb-[28px]" />
              <FeaturedPost
                post={featured}
                locale={locale}
                bylineLabel={t("byAuthor", { name: featured.author.name })}
                readingTimeLabel={
                  featured.readingMinutes ? t("readingMinutes", { minutes: featured.readingMinutes }) : null
                }
                readLabel={t("readArticle")}
              />
            </div>
          </section>
        ) : null}
        {journal.length ? (
          <section className={SECTION_SHELL}>
            <div className={SECTION_WRAP}>
              <SectionHead eyebrow={t("latestEyebrow")} headline={t("latestTitle")} flush className="mb-[34px]" />
              <div className="grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3">
                {journal.map((post, i) => (
                  <CategoryFilterItem key={post.id} category={post.category.slug} index={i}>
                    <JournalCard
                      post={post}
                      locale={locale}
                      readingTimeLabel={
                        post.readingMinutes ? t("readingMinutes", { minutes: post.readingMinutes }) : null
                      }
                      readLabel={t("readArticle")}
                    />
                  </CategoryFilterItem>
                ))}
              </div>
              <CategoryLoadMore total={journal.length} label={t("loadMore")} />
            </div>
          </section>
        ) : featured ? null : (
          <section className={SECTION_SHELL}>
            <div className={SECTION_WRAP}>
              <p className="text-ink-soft">{t("empty")}</p>
            </div>
          </section>
        )}
      </CategoryFilterProvider>
      <NewsletterSignup
        eyebrow={t("newsletter.eyebrow")}
        title={t("newsletter.title")}
        description={t("newsletter.description")}
        source="blog"
      />
    </>
  );
}
