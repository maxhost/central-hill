import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import type { BuildingSummary } from "../contract";
import { listBuildings } from "../server/queries";

/**
 * Buildings listing — the approved `mock/buildings.html` design embedded 1:1 inside the
 * live app shell, now **DB-driven**: the surrounding chrome (hero, owner CTA band, stats
 * band, earnings calculator) is the mock's static markup verbatim, but the property grid
 * is generated from the published `building` rows (`listBuildings`, ISR-cached + tagged
 * `building-list` → a publish busts it). Page styles stay scoped under `.mk` (see
 * `src/app/mock.css`) so nothing leaks to Home/admin. The real header/footer + i18n come
 * from the app layout.
 *
 * Card markup is the locked mock `.pcard` design (the Tailwind `BuildingCard` is a
 * different look — kept for other consumers); DB content is HTML-escaped before
 * interpolation. Client direction (B6):
 * - the city name is NOT shown — the meta line is `street · neighbourhood · N apartments`;
 * - the location filter bar is hidden (kept in source, commented out, not deleted);
 * - when a building has no R2 cover yet (`cover === null`) a Warm-Editorial placeholder
 *   SVG (`/placeholders/building.svg`) is shown so the card never renders empty.
 * Cards link to each building's real per-locale detail slug.
 */

/** Minimal HTML escaper for interpolating DB content into the `.mk` markup string. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PLACEHOLDER_COVER = "/placeholders/building.svg";

interface CardLabels {
  isNew: string;
  viewMore: string;
  apartments: (count: number) => string;
}

/** One `.pcard` built from a published building row (city omitted per client direction B6). */
function cardHtml(b: BuildingSummary, locale: Locale, labels: CardLabels): string {
  const cover = b.cover?.url ?? PLACEHOLDER_COVER;
  const alt = b.cover?.alt ?? b.name;
  const meta = [b.streetAddress, b.neighbourhood?.name, labels.apartments(b.stats.apartments)]
    .filter(Boolean)
    .join(" · ");
  return `
      <a class="pcard" href="/${locale}/buildings/${esc(b.slug)}">
        <div class="ph">${
          b.isNew ? `<span class="badge">★ ${esc(labels.isNew)}</span>` : ""
        }<img src="${esc(cover)}" alt="${esc(alt)}" loading="lazy"></div>
        <div class="pbody">
          <h3>${esc(b.name)}</h3>
          <div class="pmeta">${esc(meta)}</div>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">${esc(b.teaser)}</p>
          <div class="view">${esc(labels.viewMore)} →</div>
        </div>
      </a>`;
}

const PAGE_STYLE = `
/* Hero: strengthen the dark overlay over the background photo so the white headline/
   eyebrow/intro stay legible (the bright Lisbon rooftops washed out the base gradient).
   Scoped to this page only — overrides the kernel \`.mk .hero::after\` for Buildings. */
.mk[data-page="buildings"] .hero::after{background:linear-gradient(180deg,rgba(18,16,13,.46) 0%,rgba(18,16,13,.34) 45%,rgba(18,16,13,.88) 100%)}

/* Page-only: filter / IA bar (decorative, kernel-variable based) */
.mk .filterbar{border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--line) 26%,var(--bg))}
.mk .filterbar .wrap{padding-top:26px;padding-bottom:26px;display:flex;flex-wrap:wrap;align-items:center;gap:18px}
.mk .fb-city{position:relative}
.mk .fb-city select{appearance:none;-webkit-appearance:none;font-family:var(--sans);font-size:14px;font-weight:500;
  color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:3px;
  padding:11px 38px 11px 16px;cursor:pointer}
.mk .fb-city::after{content:"▾";position:absolute;right:14px;top:50%;transform:translateY(-50%);
  color:var(--ink-soft);font-size:12px;pointer-events:none}
.mk .fb-chips{display:flex;flex-wrap:wrap;gap:9px;flex:1;min-width:240px}
.mk .chip{font-size:13px;font-weight:500;letter-spacing:.01em;color:var(--ink-soft);background:var(--surface);
  border:1px solid var(--line);border-radius:100px;padding:9px 16px;cursor:pointer;transition:.2s var(--ease)}
.mk .chip:hover{border-color:var(--ink-soft);color:var(--ink)}
.mk .chip.is-active{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.mk .fb-count{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;white-space:nowrap}
@media(max-width:680px){.mk .fb-count{width:100%}}

/* Page-only: earnings calculator (kernel-variable based, matches owners est-card) */
.mk .calc-band{background:color-mix(in srgb,var(--line) 26%,var(--bg));border-top:1px solid var(--line)}
.mk .calc-card{max-width:560px;margin:0 auto;background:var(--surface);color:var(--ink);
  border:1px solid var(--line);border-radius:8px;padding:38px 34px 32px;text-align:center;
  box-shadow:0 30px 60px -30px rgba(0,0,0,.4)}
.mk .calc-card .earn-badge{display:inline-flex;align-items:center;gap:.5em;background:var(--feature-accent);color:var(--bg);
  font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:8px 16px;border-radius:30px;margin-bottom:16px}
.mk .calc-card h3{font-size:26px;margin-bottom:8px}
.mk .calc-card .calc-sub{font-size:14px;color:var(--ink-soft);margin-bottom:24px}
.mk .calc-field{margin-bottom:16px;text-align:left}
.mk .calc-field label{display:block;font-size:12px;letter-spacing:.04em;font-weight:600;color:var(--ink);margin-bottom:7px}
.mk .calc-field input{width:100%;font-family:var(--sans);font-size:15px;color:var(--ink);
  background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:13px 14px;transition:.2s var(--ease)}
.mk .calc-field input:focus{outline:none;border-color:var(--feature-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--feature-accent) 18%,transparent)}
.mk .calc-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mk .calc-card .btn{width:100%;justify-content:center;margin-top:8px}
@media(max-width:520px){.mk .calc-two{grid-template-columns:1fr}}
`;

const BODY = (locale: Locale, cardsHtml: string) => `
<!-- HERO -->
<section class="hero compact" style="padding:0">
  <img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70" alt="Rooftops and the river over Lisbon's historic centre at golden hour">
  <div class="wrap">
    <span class="eyebrow">Lisbon · Portugal</span>
    <h1>Strategic Properties in Prime Locations</h1>
    <p>Explore our carefully curated portfolio of exceptional buildings, each handpicked for its location, character, and guest experience. From historic neighbourhoods brimming with charm to prime avenues in the heart of the city, every Central Hill property is selected to offer an outstanding stay in some of Portugal's most vibrant and iconic locations.</p>
  </div>
</section>

<!-- FILTER / IA BAR — hidden per client direction (B6). Kept (commented out) so it can
     be restored once the city/neighbourhood filter is wired to the DB taxonomy.
<div class="filterbar">
  <div class="wrap">
    <label class="fb-city"><select aria-label="Select city">
      <option>Lisbon</option>
      <option>Porto</option>
      <option>Cascais</option>
    </select></label>
    <div class="fb-chips">
      <button class="chip is-active">All</button>
      <button class="chip">Bairro Alto</button>
      <button class="chip">Chiado</button>
      <button class="chip">Baixa</button>
      <button class="chip">Alfama</button>
      <button class="chip">Avenida da Liberdade</button>
      <button class="chip">Príncipe Real</button>
    </div>
    <span class="fb-count">14 Buildings</span>
  </div>
</div>
-->

<!-- BUILDING GRID -->
<section>
  <div class="wrap">
    <div class="pf-grid reveal">${cardsHtml}
    </div>
  </div>
</section>

<!-- OWNER CTA BAND -->
<section style="padding-top:0">
  <div class="wrap">
    <div class="dual reveal" style="grid-template-columns:1fr">
      <div class="dcol owner">
        <span class="eyebrow">For Owners</span>
        <h3>Looking to add your property to our portfolio?</h3>
        <p>Join the buildings above. We'll assess your apartment and show you what it could earn — free, no obligation, within 48 hours.</p>
        <a class="btn btn-accent" href="/${locale}#owners">Get Your Free Earnings Estimate →</a>
        <div class="contact-line">Call +351 910 075 725 · info@centralhill.pt · WhatsApp +351 910 075 725</div>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 3 · STATS BAND -->
<section class="stats">
  <div class="wrap">
    <h2 style="text-align:center;margin-bottom:42px">Numbers That Speak for Themselves</h2>
    <div class="stats-grid reveal" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat">
        <div class="num">400,000+</div>
        <div class="lbl">Bookings Completed</div>
        <div class="lbl" style="letter-spacing:.02em;text-transform:none;margin-top:6px">Across all managed properties</div>
      </div>
      <div class="stat">
        <div class="num">12+</div>
        <div class="lbl">Years of Experience</div>
        <div class="lbl" style="letter-spacing:.02em;text-transform:none;margin-top:6px">Optimizing owner returns in Portugal</div>
      </div>
      <div class="stat">
        <div class="num">€55M+</div>
        <div class="lbl">Revenue Generated</div>
        <div class="lbl" style="letter-spacing:.02em;text-transform:none;margin-top:6px">For our property owners</div>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 4 · EARNINGS CALCULATOR -->
<section class="calc-band">
  <div class="wrap">
    <form class="calc-card reveal">
      <span class="earn-badge">★ Earn +25%</span>
      <h3>Discover your property's earning potential</h3>
      <p class="calc-sub">Find out how much your property could earn — free, instant, no obligation.</p>
      <div class="calc-field">
        <label for="calc-addr">Property Address</label>
        <input id="calc-addr" type="text" placeholder="Street, neighbourhood, city" autocomplete="off">
      </div>
      <div class="calc-two">
        <div class="calc-field">
          <label for="calc-nprop">Nº of Properties</label>
          <input id="calc-nprop" type="number" min="1" placeholder="1">
        </div>
        <div class="calc-field">
          <label for="calc-nbed">Nº of Bedrooms</label>
          <input id="calc-nbed" type="number" min="1" placeholder="2">
        </div>
      </div>
      <a class="btn btn-accent" href="#">Calculate My Earnings →</a>
    </form>
  </div>
</section>
`;

export async function BuildingsListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [buildings, t] = await Promise.all([listBuildings(locale), getTranslations("buildings")]);

  const labels: CardLabels = {
    isNew: t("new"),
    viewMore: t("viewMore"),
    apartments: (count) => t("apartments", { count }),
  };

  const cardsHtml = buildings.length
    ? `\n${buildings.map((b) => cardHtml(b, locale, labels)).join("\n")}\n    `
    : `\n      <p style="grid-column:1/-1;color:var(--ink-soft)">${esc(t("empty"))}</p>\n    `;

  return (
    <div className="mk" data-page="buildings">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: BODY(locale, cardsHtml) }} />
    </div>
  );
}
