import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { CenteredCtaBand, ChipBar, Hero, SectionHead } from "@core/ui";
import { Icon } from "@core/ui/icon";
import { listGuideCityGroups, listTopRecommendations } from "../contract";
import { GuideCard } from "./components/guide-card";
import { RecommendationCard } from "./components/recommendation-card";

/**
 * Guides index ("What to Do in Lisbon") — the approved `mock/what-to-do.html`, fully ported
 * to components (no `.mk` raw-HTML block remains). Both card grids are **DB-driven** and
 * ISR-cached + tagged `guide-list`/`city-list` (a guides or geography publish busts them):
 *
 * - **"Explore the City"** — one section per city from the published `guide_page` rows
 *   (`listGuideCityGroups`), each a grid of the slice's `GuideCard` (the `.pcard.gcard` port)
 *   linking to the guide's per-locale detail slug (`/[locale]/guides/[city]/[slug]`).
 * - **"Top Recommendations"** — `listTopRecommendations`: one complete place (image +
 *   category + address) per Restaurant / Viewpoint / Beach, chosen by a documented,
 *   deterministic rule (see the query), rendered as the slice's `RecommendationCard` (the
 *   plain `.pcard` + `.rec-type`/`.rec-loc` port) linking to the place's guide. The whole
 *   section is omitted when no place qualifies.
 *
 * Also JSX: the **hero** (`core/ui`'s `Hero`, Buildings listing configuration), the **city
 * bar** (`ChipBar`; still no real filter behind it — every published city renders), each
 * section **shell + head** (standard page shell, `SectionHead`; copy via `guides.*`
 * messages), both grids in the Buildings listing's 3/2/1 grid, and the closing
 * `CenteredCtaBand` (its copy is still a hardcoded English literal, as before). Icons are
 * `core/ui` `<Icon>` (inline Iconoir SVG, ADR 0034); the route no longer imports `mock.css`.
 */

const HERO_IMG =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
const HERO_ALT = "Sunlit rooftops, tiled façades and the Tagus river across Lisbon's historic centre";

// Standard page shell (Real Estate, Guests): padding, 84px scroll margin, 1240px/28px column,
// and the warm `alt` band.
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

export async function GuidesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [groups, recommendations, t] = await Promise.all([
    listGuideCityGroups(locale),
    listTopRecommendations(locale),
    getTranslations("guides"),
  ]);
  const recTypeLabels = {
    restaurant: t("recType.restaurant"),
    viewpoint: t("recType.viewpoint"),
    beach: t("recType.beach"),
  };

  return (
    <Fragment>
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
          { key: "lisbon", label: t("cityLisbon"), icon: <Icon name="map-pin" size={13} />, active: true },
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
      {/*
       * "Top Recommendations": DB-driven (`listTopRecommendations` — one complete place per
       * Restaurant/Viewpoint/Beach, see its selection rule), on the `alt` band, in the same grid
       * as the city sections. The whole section is omitted when nothing qualifies.
       */}
      {recommendations.length ? (
        <section className={`${SECTION_SHELL} ${ALT_BAND}`}>
          <div className={SECTION_WRAP}>
            <SectionHead eyebrow={t("recEyebrow")} headline={t("recTitle")} intro={t("recIntro")} />
            <div className="grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} locale={locale} typeLabels={recTypeLabels} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
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
