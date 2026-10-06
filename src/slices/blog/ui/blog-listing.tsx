import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { PageHead, PageHeadSearch, SectionHead } from "@core/ui";
import { getFeaturedPost, listCategories } from "../contract";
import { CategoryTabs } from "./components/category-tabs";
import { FeaturedPost } from "./components/featured-post";

/**
 * Blog listing — the approved `mock/blog.html` inside the live app shell.
 * The header band (eyebrow, `<h1>`, lede, search field) is the `core/ui` `PageHead` +
 * `PageHeadSearch`, rendered as JSX with i18n copy (`blog.eyebrow|title|intro|searchPlaceholder|
 * searchLabel`), outside the `.mk` subtree. Below it, the **category tabs** are JSX too and
 * **DB-driven**: the slice's `CategoryTabs` (`core/ui`'s `ChipBar`, plain + centred) fed by
 * `listCategories(locale)`, which is `unstable_cache`d per locale and tagged `blog_post-list`,
 * so a category save/delete in the backoffice (`revalidateBlogList`) refreshes the page. "All"
 * (`blog.all`) + one chip per category, in admin `position` order, with the translated name and
 * the category colour as the swatch (only if it's a valid `#hex`). The chips are **inert for
 * now** — the cards below are still raw HTML, so there is nothing to filter yet; see
 * `category-tabs.tsx` for the provider/item wiring that switches filtering on once the cards
 * are JSX. Next, the **"Featured" section** is JSX and **DB-driven** as well: `core/ui`'s
 * `SectionHead` (eyebrow only, `blog.featured`) over the slice's `FeaturedPost` card, fed by
 * `getFeaturedPost(locale)` (the most recently published post flagged `is_featured`;
 * `unstable_cache`d per locale, tagged `blog_post-list`, so publishing/unfeaturing a post in the
 * backoffice refreshes it). No featured post → the whole section is omitted. The rest of the
 * page ("From the Journal" grid, Load More, newsletter) is still the mock's body markup
 * rendered verbatim, with its
 * page styles scoped under `.mk` (see `src/app/mock.css` for the shared design system) so
 * nothing leaks to Home/admin; that part is static English copy. The real header/footer come
 * from the app layout. (The search field is inert until blog search lands; the "Load More"
 * button and newsletter form are the mock's static markup for now; wiring them up is a
 * follow-up. `.reveal` is neutralised in mock.css so content stays visible.)
 */

const PAGE_STYLE = `
.mk .ctag{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:#fff;padding:5px 11px;border-radius:3px}
.mk .ctag.owner-guides{background:#0E7C7B}
.mk .ctag.str-tips{background:#2C6E8F}
.mk .ctag.pt-regs{background:#B23A3A}
.mk .ctag.lisbon{background:#B08D57}
.mk .ctag.portugal{background:#6B7280}
.mk .card-meta{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-soft);flex-wrap:wrap}
.mk .card-meta i{font-size:15px;line-height:1}
.mk .card-meta .sep{opacity:.5}
.mk .read-link{margin-top:24px;font-size:14px;font-weight:600;color:var(--accent-deep);display:inline-flex;align-items:center;gap:6px}
.mk .pcard .pbody{padding:22px 24px 26px}
.mk .pcard .ctag{margin-bottom:14px}
.mk .pcard .pbody h3{font-size:21px;line-height:1.18;margin-bottom:8px}
.mk .pcard .excerpt{font-size:14.5px;color:var(--ink-soft);margin-bottom:16px}
.mk .pcard .card-meta{margin-bottom:14px}
.mk .pcard .read-link{margin-top:0;font-size:13.5px}
.mk .newsletter{background:var(--feature);color:var(--on-feature)}
.mk .newsletter .wrap{text-align:center;max-width:720px}
.mk .newsletter .eyebrow{color:var(--feature-accent)}
.mk .newsletter h2{color:#fff;font-size:clamp(28px,3.4vw,44px);margin:14px 0 14px}
.mk .newsletter p{color:var(--on-feature-soft);font-size:17px;margin:0 auto 30px;max-width:54ch}
.mk .nl-form{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.mk .nl-form input{font-family:var(--sans);font-size:15px;color:#fff;min-width:300px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.28);border-radius:3px;padding:15px 20px}
.mk .nl-form input::placeholder{color:var(--on-feature-soft)}
.mk .nl-form input:focus{outline:none;border-color:var(--feature-accent)}
.mk .load-more{display:flex;justify-content:center;margin-top:48px}
@media(max-width:880px){
  .mk .nl-form input{min-width:0;width:100%}
}
`;

const BODY = (locale: Locale) => `
<section>
  <div class="wrap">
    <div class="sec-head reveal" style="margin-bottom:34px">
      <span class="eyebrow">Latest Articles</span>
      <h2 class="section-title">From the Journal</h2>
    </div>

    <div class="pf-grid reveal">

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=70" alt="An official short-term rental registration sign mounted by an apartment entrance"></div>
        <div class="pbody">
          <span class="ctag pt-regs">Portugal Regulations</span>
          <h3>Short-Term Rental Registration in Portugal: Everything You Need to Know (2025 Update)</h3>
          <p class="excerpt">A complete guide to AL registration, mandatory signage, safety equipment, guest reporting, and the tourist-tax rules every operator must comply with.</p>
          <div class="card-meta"><span>May 2026</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>8 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=900&q=70" alt="A bright, well-presented apartment living room ready for guests"></div>
        <div class="pbody">
          <span class="ctag str-tips">Short-Term Rental Tips</span>
          <h3>Top 5 Mistakes in Short-Term Rental Management — and How to Avoid Them</h3>
          <p class="excerpt">Even experienced owners make these common mistakes. Recognising them early can be the difference between a profitable rental and a costly one.</p>
          <div class="card-meta"><span>March 2026</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>6 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70" alt="An owner reviewing property paperwork with a management team at a desk"></div>
        <div class="pbody">
          <span class="ctag owner-guides">Owner Guides</span>
          <h3>How to Choose the Best Property Management Company in Portugal</h3>
          <p class="excerpt">In a crowded market, choosing the right management partner is one of the most important decisions you can make as an owner. Here is what to look for.</p>
          <div class="card-meta"><span>January 2026</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>5 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=70" alt="A laptop showing a revenue and occupancy analytics dashboard"></div>
        <div class="pbody">
          <span class="ctag str-tips">Short-Term Rental Tips</span>
          <h3>Dynamic Pricing Explained: How to Maximise Your Rental Income</h3>
          <p class="excerpt">Static pricing is leaving money on the table. Here is how dynamic pricing works, why it matters, and what the data says about its impact on revenue.</p>
          <div class="card-meta"><span>November 2025</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>6 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=900&q=70" alt="Aerial view of Lisbon rooftops, the river, and the castle at golden hour"></div>
        <div class="pbody">
          <span class="ctag lisbon">Lisbon</span>
          <h3>Lisbon's Best Neighbourhoods for Short-Term Rental Investment</h3>
          <p class="excerpt">From Bairro Alto to Alfama, each Lisbon neighbourhood offers a different risk-return profile. Here is how to evaluate which location works best for your goals.</p>
          <div class="card-meta"><span>September 2025</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>7 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=900&q=70" alt="A property owner reviewing documents with house keys on a table"></div>
        <div class="pbody">
          <span class="ctag owner-guides">Owner Guides</span>
          <h3>5 Things Every Property Owner Should Know Before Renting Short-Term</h3>
          <p class="excerpt">Before your first booking, there are five things every short-term rental owner in Portugal needs to understand — from registration to pricing strategy.</p>
          <div class="card-meta"><span>July 2025</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>5 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=70" alt="A beautifully staged, well-lit bedroom in a short-term rental apartment"></div>
        <div class="pbody">
          <span class="ctag str-tips">Short-Term Rental Tips</span>
          <h3>5 Interior Design Tips That Make Guests Book Again and Again</h3>
          <p class="excerpt">The way your property looks — in photos and in person — directly affects your bookings, your reviews, and your nightly rate. Here is how to get it right.</p>
          <div class="card-meta"><span>May 2025</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>5 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1469022563428-aa04fef9f5a2?auto=format&fit=crop&w=900&q=70" alt="A panoramic view of Portugal's coastline and city skyline at sunset"></div>
        <div class="pbody">
          <span class="ctag portugal">Portugal</span>
          <h3>Why Portugal Remains One of Europe's Best Short-Term Rental Markets in 2025</h3>
          <p class="excerpt">Record visitor numbers, a stable regulatory framework, and consistently strong yields — here is the investment case for Portugal's short-term rental sector.</p>
          <div class="card-meta"><span>March 2025</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>6 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

      <article class="pcard">
        <div class="ph"><img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70" alt="A freshly prepared apartment with a made bed, ready for its first guest"></div>
        <div class="pbody">
          <span class="ctag owner-guides">Owner Guides</span>
          <h3>The Essential Setup Checklist for Your First Short-Term Rental</h3>
          <p class="excerpt">Getting your property ready for its first guest involves more than cleaning and photography. Here is the complete checklist — from registration to listing optimisation.</p>
          <div class="card-meta"><span>January 2025</span><span class="sep">·</span><i class="iconoir-clock" aria-hidden="true"></i><span>7 min read</span></div>
          <a class="read-link" href="/${locale}/blog">Read Article →</a>
        </div>
      </article>

    </div>

    <div class="load-more reveal">
      <button class="btn btn-ghost">Load More Articles</button>
    </div>
  </div>
</section>

<section class="newsletter">
  <div class="wrap reveal">
    <span class="eyebrow">Newsletter</span>
    <h2>Stay Informed. Stay Ahead.</h2>
    <p>Get our latest articles on short-term rental management, Portugal regulations, and market insights — delivered to your inbox.</p>
    <form class="nl-form" onsubmit="return false">
      <input type="email" placeholder="Your email address" aria-label="Your email address" />
      <button class="btn btn-accent" type="submit">Subscribe <i class="iconoir-send-diagonal" aria-hidden="true"></i></button>
    </form>
  </div>
</section>
`;

/**
 * Blog listing: `PageHead` header (JSX, i18n) + category tabs (JSX, DB) + featured (JSX, DB) +
 * card grid + newsletter (static mock embed). The search field is inert: no `action`, and this
 * page never reads `searchParams` (that would make it dynamic), so submitting just reloads `?q=…`.
 * The tabs section reproduces the mock's `<section style="padding-top:48px;padding-bottom:0">`;
 * its 1240px/28px column comes from `ChipBar` itself. The featured section reproduces
 * `<section style="padding-top:52px;padding-bottom:0">` + `.wrap` + a `28px`-gap `.sec-head`
 * (`SectionHead` `flush` + `mb-[28px]`). Both sit outside `.mk` (see `ChipBar`'s / `SectionHead`'s
 * docstrings for why they must).
 *
 * The featured card is deliberately **not** wrapped in `CategoryFilterItem`: it is the
 * editor's pick, shown above the filterable "From the Journal" grid, so it stays visible
 * whatever category chip is selected once filtering is switched on.
 */
export async function BlogListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [t, categories, featured] = await Promise.all([
    getTranslations("blog"),
    listCategories(locale),
    getFeaturedPost(locale),
  ]);
  return (
    <>
      <PageHead eyebrow={t("eyebrow")} headline={t("title")} intro={t("intro")}>
        <PageHeadSearch placeholder={t("searchPlaceholder")} label={t("searchLabel")} />
      </PageHead>
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
      <div className="mk" data-page="blog">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <div dangerouslySetInnerHTML={{ __html: BODY(locale) }} />
      </div>
    </>
  );
}
