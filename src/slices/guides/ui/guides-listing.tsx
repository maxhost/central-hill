import { getTranslations, setRequestLocale } from "next-intl/server";
import { mediaImgTag } from "@core/media";
import type { Locale } from "@core/db/columns";
import type { GuideCityGroup, GuidePageSummary, GuideTemplate } from "../contract";
import { listGuideCityGroups } from "../contract";

/**
 * Guides index ("What to Do in Lisbon") — the approved `mock/what-to-do.html` embedded
 * 1:1 inside the live app shell, now **DB-driven** like `buildings-listing.tsx`: the
 * surrounding chrome (hero, city bar, "Top Recommendations", closing CTA band) is the
 * mock's static markup verbatim, but the "Explore the City" card grid is generated from
 * the published `guide_page` rows (`listGuideCityGroups`, ISR-cached + tagged
 * `guide-list`/`city-list` → a guides or geography publish busts it). Page styles stay
 * scoped under `.mk` (see `src/app/mock.css`) so nothing leaks to Home/admin. Cards link
 * to each guide's real per-locale detail slug (`/[locale]/guides/[city]/[slug]`).
 *
 * The city chips, "Top Recommendations" picks and closing stats band stay the mock's
 * static decorative markup for now (content brief 4.2 scopes only the guide pages
 * themselves to the DB in this pass).
 */

/** HTML-escape DB content before interpolating into the `.mk` markup string. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Iconoir glyph per editorial template — matches the mock's original per-card icon. */
const TEMPLATE_ICON: Record<GuideTemplate, string> = {
  landing: "iconoir-bank",
  eat: "iconoir-pizza-slice",
  beaches: "iconoir-sea-waves",
  events: "iconoir-music-double-note",
  secrets: "iconoir-binocular",
  families: "iconoir-group",
  groups: "iconoir-community",
  travellers: "iconoir-compass",
  custom: "iconoir-compass",
};

const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 420px";

function guideCardHtml(guide: GuidePageSummary, locale: Locale, viewLabel: string): string {
  const imgTag = mediaImgTag({
    data: guide.hero,
    fallbackAlt: guide.title,
    sizes: CARD_SIZES,
  });
  const icon = TEMPLATE_ICON[guide.template];
  return `
      <a class="pcard gcard" href="/${locale}/guides/${esc(guide.city.slug)}/${esc(guide.slug)}">
        <div class="ph">${imgTag}</div>
        <div class="pbody">
          <i class="${icon} g-ico" aria-hidden="true"></i>
          <h3>${esc(guide.title)}</h3>
          ${guide.intro ? `<p class="g-teaser">${esc(guide.intro)}</p>` : ""}
          <div class="view">${esc(viewLabel)} →</div>
        </div>
      </a>`;
}

const PAGE_STYLE = `
.mk .city-bar{border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--line) 26%,var(--bg))}
.mk .city-bar .wrap{padding-top:24px;padding-bottom:24px;display:flex;flex-wrap:wrap;align-items:center;gap:16px}
.mk .city-bar .cb-label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-weight:600}
.mk .city-chips{display:flex;flex-wrap:wrap;gap:9px;flex:1;min-width:240px}
.mk .city-chip{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;letter-spacing:.01em;
  color:var(--ink-soft);background:var(--surface);border:1px solid var(--line);border-radius:100px;
  padding:9px 16px;cursor:pointer;transition:.2s var(--ease)}
.mk .city-chip:hover{border-color:var(--ink-soft);color:var(--ink)}
.mk .city-chip.is-active{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.mk .city-chip.is-soon{color:var(--ink-soft);opacity:.7;cursor:default}
.mk .city-chip .soon{font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--accent-deep);font-weight:600}
.mk .city-note{font-size:12px;letter-spacing:.04em;color:var(--ink-soft);white-space:nowrap}

.mk .gcard .ph::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(18,16,13,0) 38%,rgba(18,16,13,.42) 100%)}
.mk .gcard .g-ico{font-size:28px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:14px}
.mk .gcard .pbody h3{font-size:22px}
.mk .gcard .g-teaser{font-size:14.5px;color:var(--ink-soft);margin-top:10px;line-height:1.55}

.mk .rec-loc{display:inline-flex;align-items:center;gap:6px;margin-top:14px;
  font-size:12.5px;letter-spacing:.04em;color:var(--ink-soft)}
.mk .rec-loc i{font-size:15px;color:var(--accent-deep)}
.mk .rec-type{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-deep);font-weight:600}
`;

function cityGroupHtml(group: GuideCityGroup, locale: Locale, labels: { guidesIn: (city: string) => string; view: string }): string {
  return `
<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Explore the City</span>
      <h2 class="section-title">${esc(labels.guidesIn(group.city.name))}</h2>
    </div>

    <div class="pf-grid reveal">${group.guides.map((g) => guideCardHtml(g, locale, labels.view)).join("")}
    </div>
  </div>
</section>`;
}

function HERO(locale: Locale, eyebrow: string, title: string, intro: string): string {
  return `
<section class="hero compact" style="padding:0">
  <img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70" alt="Sunlit rooftops, tiled façades and the Tagus river across Lisbon's historic centre">
  <div class="wrap">
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h1>${esc(title)}</h1>
    <p>${esc(intro)}</p>
  </div>
</section>

<div class="city-bar">
  <div class="wrap">
    <span class="cb-label">Choose your city</span>
    <div class="city-chips">
      <button class="city-chip is-active"><i class="iconoir-pin" aria-hidden="true"></i>Lisbon</button>
      <button class="city-chip is-soon">Porto <span class="soon">Soon</span></button>
      <button class="city-chip is-soon">Cascais <span class="soon">Soon</span></button>
    </div>
    <span class="city-note">More cities coming as Central Hill grows.</span>
  </div>
</div>`;
}

function TAIL(locale: Locale): string {
  return `
<section class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Local Favourites</span>
      <h2 class="section-title">Top Recommendations</h2>
      <p class="lede" style="margin-top:16px">A taste of what's inside the guides — a table, a viewpoint and a beach our team returns to again and again.</p>
    </div>

    <div class="pf-grid reveal">

      <a class="pcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=70" alt="Plated seafood and wine at a traditional Lisbon restaurant"></div>
        <div class="pbody">
          <span class="rec-type">Restaurant</span>
          <h3 style="margin-top:8px">Ramiro</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:8px">A Lisbon institution for fresh seafood — work through the shellfish and finish with the famous steak sandwich, just as the locals do.</p>
          <span class="rec-loc"><i class="iconoir-map-pin" aria-hidden="true"></i>Avenida Almirante Reis</span>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=70" alt="Sweeping sunset view over the Tagus from a hilltop terrace in Lisbon"></div>
        <div class="pbody">
          <span class="rec-type">Viewpoint</span>
          <h3 style="margin-top:8px">Miradouro do Adamastor</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:8px">A local-favourite kiosk terrace with a cold beer in hand and sunset views over the Tagus and the Cristo Rei statue across the river.</p>
          <span class="rec-loc"><i class="iconoir-map-pin" aria-hidden="true"></i>Santa Catarina</span>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=900&q=70" alt="Wide Atlantic beach with surfers and golden sand near Lisbon"></div>
        <div class="pbody">
          <span class="rec-type">Beach</span>
          <h3 style="margin-top:8px">Costa da Caparica</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:8px">15km of golden Atlantic sand a short hop across the river — ideal for relaxing, families and surfing, with rental gear and beach bars all summer.</p>
          <span class="rec-loc"><i class="iconoir-map-pin" aria-hidden="true"></i>Almada · near Lisbon</span>
        </div>
      </a>

    </div>
  </div>
</section>

<section class="stats" style="padding:var(--section-y) 0">
  <div class="wrap" style="text-align:center;max-width:760px">
    <span class="eyebrow" style="color:var(--feature-accent)">Your Base in the City</span>
    <h2 class="section-title" style="color:#fff;margin-top:14px">Make It a Stay to Remember</h2>
    <p style="color:var(--on-feature-soft);font-size:18px;margin:18px auto 0;max-width:60ch">Explore Lisbon by day, then come home to a design-led apartment in one of the city's most storied neighbourhoods — professionally managed, ready when you are.</p>
    <div style="margin-top:34px">
      <a class="btn btn-accent" href="/${locale}/buildings">Browse Our Apartments →</a>
    </div>
  </div>
</section>`;
}

export async function GuidesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [groups, t] = await Promise.all([listGuideCityGroups(locale), getTranslations("guides")]);

  const bodyHtml = groups.length
    ? groups.map((g) => cityGroupHtml(g, locale, { guidesIn: (city) => t("guidesIn", { city }), view: t("viewGuide") })).join("")
    : `
<section>
  <div class="wrap">
    <p class="reveal" style="color:var(--ink-soft)">${esc(t("empty"))}</p>
  </div>
</section>`;

  return (
    <div className="mk" data-page="guides">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div
        dangerouslySetInnerHTML={{
          __html: HERO(locale, t("eyebrow"), t("title"), t("intro")) + bodyHtml + TAIL(locale),
        }}
      />
    </div>
  );
}
