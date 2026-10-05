import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container, FeaturePanel, Hero, Reveal, Section, StatBand } from "@core/ui";
import { EstFormStepper, EstFormWizard, OwnerEstimateForm } from "@slices/pages/contract";
import { ContactDialog } from "@slices/settings/contract";
import { listBuildings } from "../server/queries";
import { BuildingListingCard } from "./components/building-listing-card";
import { ScrollReveal } from "./components/scroll-reveal";

/**
 * Buildings listing — the approved `mock/buildings.html` design, now composed entirely from
 * React/Tailwind components: no `dangerouslySetInnerHTML` content renders anymore (the one
 * `BODY` string left is the hidden, commented-out filter bar — see below). The property grid
 * is generated from the published `building` rows (`listBuildings`, ISR-cached + tagged
 * `building-list` → a publish busts it). The `.mk`/`PAGE_STYLE`/`<ScrollReveal>` scaffold is
 * kept only for that dormant filter bar (`src/app/mock.css`'s shared design system still
 * backs it); nothing currently rendered depends on it. The real header/footer + i18n come
 * from the app layout.
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
 *
 * The **earnings calculator is real JSX** too — the last raw-markup section on this page:
 * `@slices/pages/contract`'s `OwnerEstimateForm` (the exact Owners hero wizard, now a
 * cross-slice-reusable export — see that component's + the contract's docstrings for why),
 * two columns (form/photo), image still a fixed Pexels placeholder (no schema field).
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

/* Page-wide entrance motion — kept for the filter bar (currently hidden/commented out) and
   as a harmless no-op once it's restored; every other raw-markup section is gone now (see
   the top docstring — this page is React/Tailwind end to end), via <ScrollReveal
   page="buildings">/scroll-reveal.tsx, same pattern already applied to About/Guests/Real
   Estate. The hidden state is baked straight into the server-rendered markup (.pre-reveal,
   applied on the elements below) so there's no flash of visible-then-hidden; the <noscript>
   rule keeps content visible with JS off. Scoped to [data-page="buildings"] so it never
   touches the shared, neutralised .reveal rule in mock.css or any other page. */
.mk[data-page="buildings"] .reveal-io{transition:opacity .7s var(--ease),transform .7s var(--ease)}
.mk[data-page="buildings"] .reveal-io.pre-reveal{opacity:0;transform:translateY(18px)}
`;

const BODY = `
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
`;

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
      {/*
       * "Discover your property's earning potential" — the exact Owners hero wizard,
       * `@slices/pages/contract`'s `OwnerEstimateForm` (now a cross-slice-reusable export —
       * see that component's + the contract's docstrings), two columns (form left, photo
       * right on desktop; photo first when stacked, matching the old `.calc-media{order:-1}`
       * override). Only step 1's copy differs from Owners' own hero form — steps 2/3 are
       * fixed inside the component because they were already identical on both pages. No CTA
       * `note` here (the original markup never had one under this particular button, unlike
       * Owners' hero card). Image is still the fixed Pexels placeholder (no schema field).
       */}
      <Section className="border-t border-line bg-[color-mix(in_srgb,var(--color-line)_26%,var(--color-bg))]">
        <Container>
          <Reveal label="buildings-calculator">
            <div className="grid grid-cols-1 items-center gap-[34px] min-[981px]:grid-cols-2 min-[981px]:gap-16">
              <OwnerEstimateForm
                badge="Earn +25%"
                headline="Discover your property's earning potential"
                subheadline="Find out how much your property could earn — free, instant, no obligation."
                ctaLabel="Calculate My Earnings"
              />
              <div className="order-first min-[981px]:order-none">
                {/* eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset */}
                <img
                  src={CALC_FALLBACK_IMG}
                  alt={CALC_FALLBACK_ALT}
                  className="aspect-[4/5] w-full rounded-sm object-cover"
                />
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
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
        <div dangerouslySetInnerHTML={{ __html: BODY }} />
      </div>
    </Fragment>
  );
}
