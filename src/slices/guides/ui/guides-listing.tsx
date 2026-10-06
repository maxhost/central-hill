import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { CenteredCtaBand, ChipBar, Hero, SectionHead } from "@core/ui";
import { listGuideCityGroups } from "../contract";
import { GuideCard } from "./components/guide-card";

/**
 * Guides index ("What to Do in Lisbon") — the approved `mock/what-to-do.html`, being ported
 * to components. The "Explore the City" card grids are **DB-driven** like
 * `buildings-listing.tsx`, generated from the published `guide_page` rows (`listGuideCityGroups`, ISR-cached + tagged
 * `guide-list`/`city-list` → a guides or geography publish busts it). Cards link to each
 * guide's real per-locale detail slug (`/[locale]/guides/[city]/[slug]`).
 *
 * Now JSX: the **hero** (`core/ui`'s `Hero`, Buildings listing configuration), the **city
 * bar** (`ChipBar`; still no real filter behind it — `listGuideCityGroups` renders every
 * published city), every section **shell + head** (standard page shell, `SectionHead`), and
 * the city **guide-card grids** (the slice's own `GuideCard` — the `.pcard.gcard` port — in
 * the Buildings listing's grid). Still raw, in its own small `.mk` block (styles scoped under
 * `.mk`, see `src/app/mock.css`, so nothing leaks to Home/admin): only the "Top
 * Recommendations" card grid (static decorative picks; content brief 4.2 scopes only the guide
 * pages themselves to the DB in this pass). The closing band is `core/ui`'s `CenteredCtaBand`
 * (its copy is still a hardcoded English literal, as before). `SectionHead`s and
 * `ChipBar` stay outside `.mk` (`.mk * { margin:0; padding:0 }` is un-layered CSS and beats
 * layered Tailwind utilities; see `ChipBar`'s docstring). `PAGE_STYLE` only holds the `.mk`-scoped
 * Top Recommendations card rules, so its `<style>` can sit anywhere in the page.
 */

const PAGE_STYLE = `
.mk .rec-loc{display:inline-flex;align-items:center;gap:6px;margin-top:14px;
  font-size:12.5px;letter-spacing:.04em;color:var(--ink-soft)}
.mk .rec-loc i{font-size:15px;color:var(--accent-deep)}
.mk .rec-type{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-deep);font-weight:600}
`;

const HERO_IMG =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
const HERO_ALT = "Sunlit rooftops, tiled façades and the Tagus river across Lisbon's historic centre";

// Standard page shell (Real Estate, Guests): padding, 84px scroll margin, 1240px/28px column,
// and the warm `alt` band.
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

/** The still-raw "Top Recommendations" card grid (static picks; the shell and head are JSX). */
const RECOMMENDATIONS_HTML = `
    <div class="pf-grid">

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

    </div>`;

export async function GuidesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [groups, t] = await Promise.all([listGuideCityGroups(locale), getTranslations("guides")]);

  return (
    <Fragment>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      {/* Hero: Buildings listing's exact `Hero` configuration (as on Guests and Real Estate). */}
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
        subtitleClassName="mt-5 max-w-[60ch] text-lg"
        eyebrow={t("eyebrow")}
        headline={t("title")}
        subtitle={t("intro")}
      />
      {/* Real JSX — `core/ui`'s `ChipBar` (see its docstring + this file's top docstring). */}
      <ChipBar
        label={t("chooseCity")}
        items={[
          { key: "lisbon", label: t("cityLisbon"), icon: "iconoir-pin", active: true },
          { key: "porto", label: t("cityPorto"), soon: true, soonLabel: t("citySoon") },
          { key: "cascais", label: t("cityCascais"), soon: true, soonLabel: t("citySoon") },
        ]}
        note={t("cityNote")}
      />
      {/*
       * One section per city: JSX shell + `SectionHead` + a grid of `GuideCard`s (the Buildings
       * listing's grid: 3/2/1 columns at `mock.css`'s `.pf-grid` 980/680px breakpoints, 26px
       * gap). Static, like the original (its `.reveal` was neutralised by `mock.css`). The first
       * city's first row (3 cards) gets `priority`.
       */}
      {groups.length ? (
        groups.map((g, gi) => (
          <section key={g.city.slug} className={SECTION_SHELL}>
            <div className={SECTION_WRAP}>
              <SectionHead eyebrow="Explore the City" headline={t("guidesIn", { city: g.city.name })} />
              <div className="grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3">
                {g.guides.map((guide, i) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    locale={locale}
                    viewLabel={t("viewGuide")}
                    priority={gi === 0 && i < 3}
                  />
                ))}
              </div>
            </div>
          </section>
        ))
      ) : (
        <section className={SECTION_SHELL}>
          <div className={SECTION_WRAP}>
            <p className="text-ink-soft">{t("empty")}</p>
          </div>
        </section>
      )}
      {/* "Top Recommendations": JSX shell on the `alt` band + `SectionHead`; cards still raw. */}
      <section className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <SectionHead
            eyebrow="Local Favourites"
            headline="Top Recommendations"
            intro="A taste of what's inside the guides — a table, a viewpoint and a beach our team returns to again and again."
          />
          <div className="mk" data-page="guides">
            <div dangerouslySetInnerHTML={{ __html: RECOMMENDATIONS_HTML }} />
          </div>
        </div>
      </section>
      {/* Closing CTA: `core/ui`'s `CenteredCtaBand` (the mock's centred dark `.stats` band). */}
      <CenteredCtaBand
        eyebrow="Your Base in the City"
        headline="Make It a Stay to Remember"
        body="Explore Lisbon by day, then come home to a design-led apartment in one of the city's most storied neighbourhoods — professionally managed, ready when you are."
        cta={{ href: `/${locale}/buildings`, label: "Browse Our Apartments →" }}
      />
    </Fragment>
  );
}
