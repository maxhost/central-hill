import { getTranslations, setRequestLocale } from "next-intl/server";
import { mediaImgTag } from "@core/media";
import type { Locale } from "@core/db/columns";
import { EstFormStepper, EstFormWizard } from "@slices/pages/contract";
import { ContactDialog } from "@slices/settings/contract";
import type { BuildingSummary } from "../contract";
import { listBuildings } from "../server/queries";
import { HeroContactCta } from "./components/hero-contact-cta";

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

// TEMP: Pexels placeholder for the earnings-calculator's photo column (client direction).
const CALC_FALLBACK_IMG =
  "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1200";
const CALC_FALLBACK_ALT = "A bright, professionally staged Central Hill managed apartment";

// `.pf-grid` is 3 columns inside the 1240px `.wrap` (28px padding, 1px gaps),
// 2 columns under 980px and 1 under 680px — see `mock.css`.
const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 394px";

interface CardLabels {
  isNew: string;
  viewMore: string;
  apartments: (count: number) => string;
}

/** One `.pcard` built from a published building row (city omitted per client direction B6).
 *  When the building has booking enabled + an external URL, the whole card links out to it
 *  (new tab) instead of the internal detail page. */
function cardHtml(b: BuildingSummary, locale: Locale, labels: CardLabels): string {
  const coverTag = mediaImgTag({
    data: b.cover,
    fallbackSrc: PLACEHOLDER_COVER,
    fallbackAlt: b.name,
    sizes: CARD_SIZES,
  });
  const meta = [b.streetAddress, b.neighbourhood?.name, labels.apartments(b.stats.apartments)]
    .filter(Boolean)
    .join(" · ");
  const bookOut = b.booking.enabled && Boolean(b.booking.url);
  const href = bookOut ? b.booking.url! : `/${locale}/buildings/${b.slug}`;
  const targetAttr = bookOut ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `
      <a class="pcard" href="${esc(href)}"${targetAttr}>
        <div class="ph">${
          b.isNew ? `<span class="badge">★ ${esc(labels.isNew)}</span>` : ""
        }${coverTag}</div>
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

/* "Contact Us" CTA under the hero copy — the button is a portaled Tailwind ContactDialog
   trigger (see hero-contact-cta.tsx), so it needs its padding restored: the kernel's
   \`.mk *{margin:0;padding:0}\` reset wins the specificity tie against Tailwind's px-7/py-3
   utility classes (same fix as the Owners hero). */
.mk[data-page="buildings"] .hero .hero-cta{margin-top:8px}
.mk[data-page="buildings"] .hero .hero-cta button{padding:0.75rem 1.75rem}

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

/* Page-only: earnings calculator — the exact Owners hero earnings-estimate wizard
   (.est-card/.est-field/.wiz-*), reused verbatim (same classes, same behaviour via
   EstFormStepper/EstFormWizard from @slices/pages/contract) so the two forms are
   genuinely identical, not just similar. Laid out in two columns: form left, photo right. */
.mk .calc-band{background:color-mix(in srgb,var(--line) 26%,var(--bg));border-top:1px solid var(--line)}
.mk .calc-wrap{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;max-width:var(--max)}
.mk .calc-media img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:3px;display:block}
.mk .calc-band .est-card{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:34px 32px 30px;box-shadow:0 30px 60px -30px rgba(0,0,0,.4)}
.mk .calc-band .est-card .earn-badge{display:inline-flex;align-items:center;gap:.5em;background:var(--accent);color:#fff;font-size:13px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:9px 18px;border-radius:30px;margin-bottom:16px;box-shadow:0 10px 24px -10px color-mix(in srgb,var(--accent) 75%,transparent)}
.mk .calc-band .est-card h3{font-size:26px;margin-bottom:8px}
.mk .calc-band .est-card .est-sub{font-size:14px;color:var(--ink-soft);margin-bottom:22px}
.mk .calc-band .est-field{margin-bottom:16px}
.mk .calc-band .est-field label{display:block;font-size:12px;letter-spacing:.04em;font-weight:600;color:var(--ink);margin-bottom:7px}
.mk .calc-band .est-field input,.mk .calc-band .est-field select{width:100%;height:44px;font-family:var(--sans);font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:0 14px;transition:.2s var(--ease)}
.mk .calc-band .est-field select{appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:34px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235c544c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-size:15px}
.mk .calc-band .est-field input:focus,.mk .calc-band .est-field select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.mk .calc-band .est-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mk .calc-band .est-stepper{display:flex;align-items:center;justify-content:space-between;height:44px;border:1px solid var(--line);border-radius:4px;background:var(--bg);padding:0 3px}
.mk .calc-band .est-stepper .step-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;flex:0 0 auto;border:0;border-radius:4px;background:transparent;color:var(--ink);cursor:pointer;transition:.2s var(--ease)}
.mk .calc-band .est-stepper .step-btn svg{width:16px;height:16px}
.mk .calc-band .est-stepper .step-btn:hover:not(:disabled){background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent-deep)}
.mk .calc-band .est-stepper .step-btn:disabled{opacity:.35;cursor:not-allowed}
.mk .calc-band .est-stepper .step-val{flex:1;text-align:center;font-size:15px;font-weight:600;color:var(--ink)}
.mk .calc-band .est-card .btn{width:100%;justify-content:center;margin-top:6px}
.mk .calc-band .est-note{text-align:center;font-size:12.5px;color:var(--ink);font-weight:500;margin-top:14px}
.mk .calc-band .wiz-dots{display:flex;gap:6px;margin-bottom:22px}
.mk .calc-band .wiz-dots span{flex:1;height:3px;border-radius:2px;background:var(--line);transition:.3s var(--ease)}
.mk .calc-band .wiz-dots span.done{background:var(--accent)}
.mk .calc-band .est-phone{display:flex;gap:10px}
.mk .calc-band .est-phone select{width:112px;flex:0 0 auto;padding-left:12px;padding-right:30px;background-position:right 9px center}
.mk .calc-band .est-phone input{flex:1;min-width:0}
.mk .calc-band .est-check{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.5;color:var(--ink-soft);cursor:pointer;margin-bottom:12px}
.mk .calc-band .est-check input{width:16px;height:16px;flex:0 0 auto;margin-top:2px;accent-color:var(--accent)}
.mk .calc-band .est-check a{color:var(--ink);text-decoration:underline;text-underline-offset:2px}
.mk .calc-band .wiz-actions{display:flex;align-items:center;gap:14px;margin-top:6px}
.mk .calc-band .wiz-actions .btn{margin-top:0}
.mk .calc-band .wiz-back{background:none;border:0;padding:0;font-size:13px;font-weight:600;color:var(--ink-soft);cursor:pointer;flex:0 0 auto}
.mk .calc-band .wiz-back:hover{color:var(--accent-deep)}
.mk .calc-band .wiz-confirm{text-align:center;padding:18px 0 6px}
.mk .calc-band .wiz-confirm .ic{width:46px;height:46px;color:var(--accent);border:1px solid var(--line);border-radius:50%;padding:12px;margin-bottom:18px}
.mk .calc-band .wiz-confirm h3{margin-bottom:10px}
.mk .calc-band .wiz-confirm p{font-size:14.5px;line-height:1.6;color:var(--ink-soft)}
@media(max-width:980px){.mk .calc-wrap{grid-template-columns:1fr;gap:34px}.mk .calc-media{order:-1}}
@media(max-width:520px){.mk .calc-band .est-two{grid-template-columns:1fr}}
`;

function BODY(locale: Locale, cardsHtml: string): string {
  const calcImg = mediaImgTag({
    fallbackSrc: CALC_FALLBACK_IMG,
    fallbackAlt: CALC_FALLBACK_ALT,
    sizes: "(max-width: 980px) 100vw, 560px",
  });
  return `
<!-- HERO -->
<section class="hero compact" style="padding:0">
  <img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70" alt="Rooftops and the river over Lisbon's historic centre at golden hour">
  <div class="wrap">
    <span class="eyebrow">Lisbon · Portugal</span>
    <h1>Strategic Properties in Prime Locations</h1>
    <p>Explore our carefully curated portfolio of exceptional buildings, each handpicked for its location, character, and guest experience. From historic neighbourhoods brimming with charm to prime avenues in the heart of the city, every Central Hill property is selected to offer an outstanding stay in some of Portugal's most vibrant and iconic locations.</p>
    <div class="hero-cta" id="hero-contact-slot"></div>
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

<!-- SECTION 4 · EARNINGS CALCULATOR — the exact Owners hero wizard, two columns (form
     left, photo right; see hero-contact-cta.tsx's sibling doc comment for why this is a
     duplicate of the Owners markup rather than a cross-slice import of it). -->
<section class="calc-band">
  <div class="wrap calc-wrap">
    <form class="est-card reveal" data-wizard data-step="1" onsubmit="return false">
      <div class="wiz-dots" aria-hidden="true"><span data-dot="1"></span><span data-dot="2"></span><span data-dot="3"></span></div>

      <div class="wiz-panel" data-panel="1">
        <span class="earn-badge">★ Earn +25%</span>
        <h3>Discover your property's earning potential</h3>
        <p class="est-sub">Find out how much your property could earn — free, instant, no obligation.</p>
        <div class="est-field">
          <label for="calc-addr">Property Address</label>
          <input id="calc-addr" type="text" placeholder="Street, neighbourhood, city" autocomplete="off">
        </div>
        <div class="est-two">
          <div class="est-field">
            <label>Nº of Properties</label>
            <div class="est-stepper" data-stepper data-value="1" data-min="1">
              <button type="button" class="step-btn" data-step="down" disabled aria-label="Decrease number of properties">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>
              </button>
              <span class="step-val">1</span>
              <button type="button" class="step-btn" data-step="up" aria-label="Increase number of properties">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <input type="hidden" id="calc-nprop" name="calc-nprop" value="1">
            </div>
          </div>
          <div class="est-field">
            <label for="calc-nbed">Nº of Bedrooms</label>
            <select id="calc-nbed">
              <option>Studio</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6+</option>
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-accent" data-wiz-next>Calculate My Earnings →</button>
      </div>

      <div class="wiz-panel" data-panel="2" hidden>
        <h3>Your contact details</h3>
        <p class="est-sub">Almost there — tell us how to reach you with the study.</p>
        <div class="est-field">
          <label for="calc-fname">Full Name</label>
          <input id="calc-fname" type="text" placeholder="Jane Doe" autocomplete="name">
        </div>
        <div class="est-field">
          <label for="calc-femail">Email</label>
          <input id="calc-femail" type="email" placeholder="jane@example.com" autocomplete="email">
        </div>
        <div class="est-field">
          <label for="calc-fphone">Phone</label>
          <div class="est-phone">
            <select id="calc-fphone-code" aria-label="Country code">
              <option value="+351" selected>🇵🇹 +351</option>
              <option value="+34">🇪🇸 +34</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+49">🇩🇪 +49</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+55">🇧🇷 +55</option>
            </select>
            <input id="calc-fphone" type="tel" placeholder="912 345 678" autocomplete="tel">
          </div>
        </div>
        <label class="est-check"><input type="checkbox">I agree to the <a href="#">Terms &amp; Conditions</a>.</label>
        <label class="est-check"><input type="checkbox">I agree to the <a href="#">Privacy Policy</a> and consent to being contacted.</label>
        <div class="wiz-actions">
          <button type="button" class="wiz-back" data-wiz-back>← Back</button>
          <button type="button" class="btn btn-accent" data-wiz-next>Submit request →</button>
        </div>
      </div>

      <div class="wiz-panel" data-panel="3" hidden>
        <div class="wiz-confirm">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          <h3>Request received</h3>
          <p>Thank you — our team will review your property and get back to you within 48 hours with your free profitability study.</p>
        </div>
      </div>
    </form>
    <div class="calc-media reveal">${calcImg}</div>
  </div>
</section>
`;
}

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
      <HeroContactCta>
        <ContactDialog
          variant="light"
          label="Contact Us"
          title="Contact us"
          intro="Send us a message and our team will get back to you shortly."
          source="buildings-hero"
        />
      </HeroContactCta>
      <EstFormStepper />
      <EstFormWizard />
      <div dangerouslySetInnerHTML={{ __html: BODY(locale, cardsHtml) }} />
    </div>
  );
}
