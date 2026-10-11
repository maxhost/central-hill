import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container, Reveal, Section } from "@core/ui";
import {
  BuildingsCalculator,
  BuildingsHero,
  BuildingsOwnerPanel,
  BuildingsStats,
  getBuildingsPage,
} from "@slices/pages/contract";
import { listBuildings } from "../server/queries";
import { BuildingListingCard } from "./components/building-listing-card";

/**
 * Buildings listing — the approved `mock/buildings.html` design, composed entirely from
 * React/Tailwind components (no `.mk` markup, no `dangerouslySetInnerHTML`). The property grid
 * is generated from the published `building` rows (`listBuildings`, ISR-cached + tagged
 * `building-list` → a publish busts it). The real header/footer + i18n come from the app layout.
 *
 * The **editable sections** — hero, "For Owners" panel, figures band and earnings calculator —
 * live in slice `pages` (spec buildings-admin-editor S2) and come through its contract:
 * `getBuildingsPage(locale)` reads the `buildings` `page_content` row (edited at
 * `/admin/pages/buildings`; no row → `defaultBuildings`) and `BuildingsHero` /
 * `BuildingsOwnerPanel` / `BuildingsStats` / `BuildingsCalculator` render it (blank fields →
 * `pages.buildings.*` i18n). This file only composes them around its own grid:
 * hero → grid → owner panel → stats → calculator.
 *
 * The **building grid is real JSX** too: `./components/building-listing-card.tsx`'s
 * `BuildingListingCard`, the locked mock `.pcard` design ported 1:1 — purpose-built for this
 * grid (not `core/ui`'s `PropertyCard`, Home/Guest's smaller featured-portfolio card; see
 * that file's docstring for why). Client
 * direction (B6):
 * - the city name is NOT shown — the meta line is `street · neighbourhood · N apartments`;
 * - the location filter bar (city select + neighbourhood chips + count) is hidden. Its old
 *   mock markup was removed with the rest of the dead `.mk` scaffold; when the filter is wired
 *   to the geography taxonomy, rebuild it with `core/ui`'s `ChipBar` (the Blog/Guides filter
 *   sibling). The original markup is in git history (`buildings-listing.tsx` before the
 *   "remove dead .mk scaffold" commit);
 * - when a building has no R2 cover yet (`cover === null`) a Warm-Editorial placeholder
 *   SVG (`/placeholders/building.svg`) is shown so the card never renders empty.
 * Cards link to each building's real per-locale detail slug.
 */

export async function BuildingsListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [buildings, t, page] = await Promise.all([
    listBuildings(locale),
    getTranslations("buildings"),
    getBuildingsPage(locale),
  ]);

  return (
    <Fragment>
      {/* JS-off fallback: `Reveal` renders hidden until it scrolls into view (as Home/Guests do). */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      {/* Editable hero (slice `pages`, spec buildings-admin-editor S2). */}
      <BuildingsHero page={page} locale={locale} />
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
      {/* Editable "For Owners" panel → figures band → earnings calculator (`#estimate`, the
          panel button's target) — slice `pages`, spec buildings-admin-editor S2. */}
      <BuildingsOwnerPanel page={page} locale={locale} />
      <BuildingsStats page={page} locale={locale} />
      <BuildingsCalculator page={page} locale={locale} />
    </Fragment>
  );
}
