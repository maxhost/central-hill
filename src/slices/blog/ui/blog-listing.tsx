import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";

/**
 * Blog listing — the approved `mock/blog.html` embedded 1:1 inside the live app shell.
 * The mock's body markup is rendered verbatim; its page styles are scoped under `.mk`
 * (see `src/app/mock.css` for the shared design system) so nothing leaks to Home/admin.
 * No database is read here — content is static, matching the mock exactly. The real
 * header/footer + i18n come from the app layout. (The search input, category tabs,
 * "Load More" button, and newsletter form are the mock's static markup for now; wiring
 * them up is a follow-up. `.reveal` is neutralised in mock.css so content stays visible.)
 */

const PAGE_STYLE = `
.mk .blog-head{background:color-mix(in srgb,var(--line) 30%,var(--bg));border-bottom:1px solid var(--line)}
.mk .blog-head .wrap{padding-top:128px;padding-bottom:64px;text-align:center}
.mk .blog-head h1{font-size:clamp(34px,4.6vw,58px);max-width:18ch;margin:14px auto 18px}
.mk .blog-head .lede{margin:0 auto;max-width:60ch}
.mk .blog-search{max-width:560px;margin:34px auto 0;position:relative}
.mk .blog-search i{position:absolute;left:20px;top:50%;transform:translateY(-50%);font-size:20px;color:var(--ink-soft);line-height:1}
.mk .blog-search input{width:100%;font-family:var(--sans);font-size:15px;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:100px;padding:16px 22px 16px 52px;transition:.2s var(--ease)}
.mk .blog-search input::placeholder{color:var(--ink-soft)}
.mk .blog-search input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.mk .cat-tabs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.mk .cat-tab{font-family:var(--sans);font-size:13px;font-weight:500;letter-spacing:.01em;color:var(--ink-soft);background:var(--surface);border:1px solid var(--line);border-radius:100px;padding:9px 18px;cursor:pointer;transition:.2s var(--ease);display:inline-flex;align-items:center;gap:8px}
.mk .cat-tab:hover{border-color:var(--ink-soft);color:var(--ink)}
.mk .cat-tab .swatch{width:9px;height:9px;border-radius:50%;display:inline-block}
.mk .cat-tab.is-active{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.mk .ctag{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:#fff;padding:5px 11px;border-radius:3px}
.mk .ctag.owner-guides{background:#0E7C7B}
.mk .ctag.str-tips{background:#2C6E8F}
.mk .ctag.pt-regs{background:#B23A3A}
.mk .ctag.lisbon{background:#B08D57}
.mk .ctag.portugal{background:#6B7280}
.mk .featured{display:grid;grid-template-columns:1.15fr .85fr;gap:0;background:var(--surface);border:1px solid var(--line);overflow:hidden}
.mk .featured .feat-img{position:relative;min-height:340px}
.mk .featured .feat-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mk .featured .feat-body{padding:46px 48px;display:flex;flex-direction:column;justify-content:center}
.mk .featured h3{font-size:clamp(26px,2.6vw,36px);margin:16px 0 14px;line-height:1.12}
.mk .featured p{font-size:16px;color:var(--ink-soft);margin-bottom:22px}
.mk .feat-meta,.mk .card-meta{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-soft);flex-wrap:wrap}
.mk .feat-meta i,.mk .card-meta i{font-size:15px;line-height:1}
.mk .feat-meta .sep,.mk .card-meta .sep{opacity:.5}
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
  .mk .featured{grid-template-columns:1fr}
  .mk .featured .feat-img{min-height:240px}
  .mk .featured .feat-body{padding:34px 30px}
  .mk .nl-form input{min-width:0;width:100%}
}
`;

const BODY = (locale: Locale) => `
<section class="blog-head" style="padding:0">
  <div class="wrap reveal">
    <span class="eyebrow">The Central Hill Journal</span>
    <h1>Insights on Short-Term Rentals, Property Management &amp; Portugal</h1>
    <p class="lede">Expert guides, practical tips, and local knowledge for property owners, investors, and anyone navigating the Portuguese short-term rental market.</p>
    <div class="blog-search">
      <i class="iconoir-search" aria-hidden="true"></i>
      <input type="search" placeholder="Search articles…" aria-label="Search articles" />
    </div>
  </div>
</section>

<section style="padding-top:48px;padding-bottom:0">
  <div class="wrap reveal">
    <div class="cat-tabs">
      <button class="cat-tab is-active"><span class="swatch" style="background:var(--accent)"></span>All</button>
      <button class="cat-tab"><span class="swatch" style="background:#0E7C7B"></span>Owner Guides</button>
      <button class="cat-tab"><span class="swatch" style="background:#2C6E8F"></span>Short-Term Rental Tips</button>
      <button class="cat-tab"><span class="swatch" style="background:#B23A3A"></span>Portugal Regulations</button>
      <button class="cat-tab"><span class="swatch" style="background:#B08D57"></span>Lisbon</button>
      <button class="cat-tab"><span class="swatch" style="background:#6B7280"></span>Portugal</button>
    </div>
  </div>
</section>

<section style="padding-top:52px;padding-bottom:0">
  <div class="wrap">
    <div class="sec-head reveal" style="margin-bottom:28px">
      <span class="eyebrow">Featured</span>
    </div>
    <article class="featured reveal">
      <div class="feat-img">
        <img src="https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1200&q=70" alt="A registration certificate and keys on a table inside a prepared Lisbon apartment">
      </div>
      <div class="feat-body">
        <div><span class="ctag pt-regs">Portugal Regulations</span></div>
        <h3>Short-Term Rental Registration in Portugal: Everything You Need to Know (2025 Update)</h3>
        <p>A complete guide to the legal requirements for operating a short-term rental in Portugal — from the AL licence and mandatory signage to fire extinguishers, guest registration, and tourist tax obligations.</p>
        <div class="feat-meta">
          <span>By Central Hill Apartments</span><span class="sep">·</span>
          <span>June 2025</span><span class="sep">·</span>
          <i class="iconoir-clock" aria-hidden="true"></i><span>8 min read</span>
        </div>
        <a class="read-link" href="/${locale}/blog">Read Article →</a>
      </div>
    </article>
  </div>
</section>

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

/** Blog listing: hero + featured + category tabs + card grid + newsletter (static mock embed). */
export async function BlogListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  return (
    <div className="mk" data-page="blog">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: BODY(locale) }} />
    </div>
  );
}
