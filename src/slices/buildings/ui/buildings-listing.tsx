import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { mediaImgTag } from "@core/media";
import type { Locale } from "@core/db/columns";
import { Container, FeaturePanel, Hero, Reveal, Section, StatBand } from "@core/ui";
import { EstFormStepper, EstFormWizard } from "@slices/pages/contract";
import { ContactDialog } from "@slices/settings/contract";
import { listBuildings } from "../server/queries";
import { BuildingListingCard } from "./components/building-listing-card";
import { ScrollReveal } from "./components/scroll-reveal";

/**
 * Buildings listing — the approved `mock/buildings.html` design embedded 1:1 inside the
 * live app shell, now **DB-driven**: the only remaining raw-markup chrome is the earnings
 * calculator; the property grid is generated from the published `building` rows
 * (`listBuildings`, ISR-cached + tagged `building-list` → a publish busts it). Page styles
 * stay scoped under `.mk` (see `src/app/mock.css`) so nothing leaks to Home/admin. The real
 * header/footer + i18n come from the app layout.
 *
 * The **hero is real JSX**, not interpolated markup: `core/ui`'s `<Hero compact align="center">`
 * (no `aside` — single-column, text + one CTA). This page has no `page_content` row, so every
 * hero string/image is still a fixed literal, same as before this port — only the markup
 * changed, not the content model.
 *
 * The **building grid is real JSX** too: `./components/building-listing-card.tsx`'s
 * `BuildingListingCard`, the locked mock `.pcard` design ported 1:1 — purpose-built for this
 * grid (not `core/ui`'s `PropertyCard`, Home/Guest's smaller featured-portfolio card, and not
 * the slice's own unused `building-card.tsx`; see that new file's docstring for why). Client
 * direction (B6):
 * - the city name is NOT shown — the meta line is `street · neighbourhood · N apartments`;
 * - the location filter bar is hidden (kept in source, commented out, not deleted);
 * - when a building has no R2 cover yet (`cover === null`) a Warm-Editorial placeholder
 *   SVG (`/placeholders/building.svg`) is shown so the card never renders empty.
 * Cards link to each building's real per-locale detail slug.
 *
 * The **"For Owners" band is real JSX** too: `core/ui`'s new `FeaturePanel`, ported 1:1 from
 * the old `.mk`-scoped `.dual`/`.dcol.owner`/`.contact-line` CSS (shared `mock.css` rules,
 * untouched — other `.mk`-embedded pages may still use them). No schema field backs it; every
 * string is a fixed literal, same as before this port.
 *
 * The **"Numbers That Speak for Themselves" stats band is real JSX** too: the same `core/ui`
 * `StatBand` Owners/Home use, extended with `columns`/per-cell `description` (see that
 * component's docstring) — still the same fixed literals as before this port.
 */

// Hero background — no schema field (this page has no `page_content` row), so it's a fixed
// Unsplash photo, same as before this port.
const HERO_IMG =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
const HERO_ALT = "Rooftops and the river over Lisbon's historic centre at golden hour";

// TEMP: Pexels placeholder for the earnings-calculator's photo column (client direction).
const CALC_FALLBACK_IMG =
  "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1200";
const CALC_FALLBACK_ALT = "A bright, professionally staged Central Hill managed apartment";

const PAGE_STYLE = `
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

/* Page-wide entrance motion for the one remaining raw-markup section (the earnings
   calculator), immediate on load for above-the-fold content, on scroll for the rest, via
   <ScrollReveal page="buildings">/scroll-reveal.tsx — same pattern already applied to
   About/Guests/Real Estate. The building grid, "For Owners" band, and stats band now animate
   separately via core/ui's Reveal component (real JSX, outside .mk — see
   BuildingListingCard's hover, which is Tailwind on the card itself, not .pcard's mock.css
   rule). The hidden state is baked straight into the server-rendered markup (.pre-reveal,
   applied on the elements below) so there's no flash of visible-then-hidden; the <noscript>
   rule keeps content visible with JS off. Scoped to [data-page="buildings"] so it never
   touches the shared, neutralised .reveal rule in mock.css or any other page. */
.mk[data-page="buildings"] .reveal-io{transition:opacity .7s var(--ease),transform .7s var(--ease)}
.mk[data-page="buildings"] .reveal-io.pre-reveal{opacity:0;transform:translateY(18px)}
`;

function BODY(): string {
  const calcImg = mediaImgTag({
    fallbackSrc: CALC_FALLBACK_IMG,
    fallbackAlt: CALC_FALLBACK_ALT,
    sizes: "(max-width: 980px) 100vw, 560px",
  });
  return `
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

<!-- SECTION 4 · EARNINGS CALCULATOR — the exact Owners hero wizard, two columns (form
     left, photo right). Markup is duplicated from Owners rather than cross-slice-imported
     (not part of any slice's public contract); the client wiring (EstFormStepper/
     EstFormWizard) is genuinely shared, via @slices/pages/contract. -->
<section class="calc-band">
  <div class="wrap calc-wrap">
    <form class="est-card reveal reveal-io pre-reveal" data-wizard data-step="1" onsubmit="return false">
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
    <div class="calc-media reveal reveal-io pre-reveal">${calcImg}</div>
  </div>
</section>
`;
}

export async function BuildingsListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [buildings, t] = await Promise.all([listBuildings(locale), getTranslations("buildings")]);

  return (
    <Fragment>
      {/*
       * Real JSX — `core/ui`'s `Hero`, single-column (no `aside`), ported 1:1 from the old
       * `.mk`-scoped overrides (now deleted) that strengthened the overlay, vertically
       * centered the copy, and widened the wrap/headline/subtitle beyond the kernel's/other
       * Hero consumers' defaults. See `hero.tsx`'s docstring for why that needed five new
       * additive props rather than reusing `compact` as-is. No schema field backs this
       * page's hero (`HERO_IMG`/every string below is a fixed literal, same as before).
       */}
      <Hero
        background={
          // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
          <img src={HERO_IMG} alt={HERO_ALT} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        }
        compact
        align="center"
        overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
        wrapClassName="mx-auto max-w-[1600px] p-10"
        copyClassName="max-w-none"
        headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitleClassName="max-w-[60ch]"
        actionsClassName="mt-2"
        eyebrow="Lisbon · Portugal"
        headline="Strategic Properties in Prime Locations"
        subtitle="Explore our carefully curated portfolio of exceptional buildings — each handpicked for its location, character, and guest experience across Portugal's most vibrant neighbourhoods."
        actions={
          <ContactDialog
            variant="light"
            label="Contact Us"
            title="Contact us"
            intro="Send us a message and our team will get back to you shortly."
            source="buildings-hero"
          />
        }
      />
      {/*
       * Real JSX — the building grid, `./components/building-listing-card.tsx`'s
       * `BuildingListingCard` (the locked `.pcard` design, ported to Tailwind) inside
       * `core/ui`'s `Section`/`Container`, wrapped in one `<Reveal>` (the simplification
       * already used for every other migrated section's entrance animation this session,
       * e.g. Owners' `StepGallery`/`StatBand` — not a per-card stagger).
       */}
      <Section>
        <Container>
          {buildings.length > 0 ? (
            <Reveal label="buildings-grid">
              <div className="grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3">
                {buildings.map((b) => (
                  <BuildingListingCard key={b.id} building={b} locale={locale} />
                ))}
              </div>
            </Reveal>
          ) : (
            <p className="text-ink-soft">{t("empty")}</p>
          )}
        </Container>
      </Section>
      {/*
       * Real JSX — "For Owners" band, `core/ui`'s new `FeaturePanel`, ported 1:1 from the old
       * `.mk`-scoped `.dual`/`.dcol.owner`/`.contact-line` CSS (shared `mock.css` rules — left
       * untouched, still used by other `.mk`-embedded pages). `pb-only` wrapper (no `Section`)
       * mirrors the original's `padding-top:0` — it sits flush under the grid above, which
       * already carries the gap — same technique `DualCtaPanels` uses for the same reason.
       */}
      <div className="pb-[clamp(64px,10vw,160px)]">
        <Container>
          <Reveal label="buildings-owner-panel">
            <FeaturePanel
              eyebrow="For Owners"
              title="Looking to add your property to our portfolio?"
              body="Join the buildings above. We'll assess your apartment and show you what it could earn — free, no obligation, within 48 hours."
              cta={{ href: `/${locale}#owners`, label: "Get Your Free Earnings Estimate →" }}
              contactLine="Call +351 910 075 725 · info@centralhill.pt · WhatsApp +351 910 075 725"
            />
          </Reveal>
        </Container>
      </div>
      {/*
       * "Numbers That Speak for Themselves" — the shared `core/ui` `StatBand` (same component
       * Owners' bare "numbers" band and Home use), ported 1:1 from the old `.mk`-scoped
       * `.stats`/`.stats-grid`/`.stat .lbl` CSS (shared `mock.css` rules — left untouched).
       * Needed two additive extensions to `StatBand` itself: `columns={3}` (this page's grid
       * is 3-up, not the default 4) and each cell's `description` (a second line under the
       * label — the original reused one `.lbl` class for both via an inline style override;
       * see that component's docstring). No schema field backs these figures; they're the
       * same fixed literals as before this port.
       */}
      <Reveal label="buildings-stats">
        <StatBand
          title="Numbers That Speak for Themselves"
          columns={3}
          cells={[
            { value: "400,000+", label: "Bookings Completed", description: "Across all managed properties" },
            { value: "12+", label: "Years of Experience", description: "Optimizing owner returns in Portugal" },
            { value: "€55M+", label: "Revenue Generated", description: "For our property owners" },
          ]}
        />
      </Reveal>
      <div className="mk" data-page="buildings">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: `.mk[data-page="buildings"] .pre-reveal{opacity:1!important;transform:none!important}`,
            }}
          />
        </noscript>
        <ScrollReveal page="buildings" />
        <EstFormStepper />
        <EstFormWizard />
        <div dangerouslySetInnerHTML={{ __html: BODY() }} />
      </div>
    </Fragment>
  );
}
