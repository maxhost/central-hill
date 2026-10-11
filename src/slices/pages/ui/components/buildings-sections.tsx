import { getTranslations } from "next-intl/server";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import { Container, FeaturePanel, Hero, Reveal, Section, StatBand } from "@core/ui";
import { ContactDialog, getGlobals } from "@slices/settings/contract";
import type { BuildingsPage } from "../../contract";
import {
  BUILDINGS_CALC_FALLBACK_ALT,
  BUILDINGS_CALC_FALLBACK_IMG,
  BUILDINGS_HERO_ALT,
  BUILDINGS_HERO_IMG,
} from "../../schemas/buildings";
import { ownersFinalContactLine } from "../contact-line";
import { orMessage } from "../or-message";
import { describedStatFigureCells, statBandColumns } from "../stat-figure-value";
import { OwnerEstimateForm } from "./owner-estimate-form";
import { SIDE_MEDIA_CLASS, sideMedia } from "./side-media";

/**
 * The Buildings listing's editable sections (spec buildings-admin-editor S2), moved 1:1 from
 * slice `buildings`' `buildings-listing.tsx` (same JSX / classes) and fed by the `buildings`
 * `page_content` row. Every text field is `orMessage(field, i18n)`: blank → `pages.buildings.*`
 * (EN = the literal the page always showed), so an all-blank row renders the page unchanged.
 * Each section takes the page read once by the listing (`getBuildingsPage(locale)`) + `locale`.
 */

type SectionProps = { page: BuildingsPage; locale: Locale };

/**
 * `core/ui`'s `Hero`, single-column (no `aside`), with the strengthened overlay, vertically
 * centered copy and widened wrap/headline/subtitle this page has always used (see `hero.tsx`'s
 * docstring). Background = the picked asset, else the stock Unsplash photo. The contact button
 * and dialog fall back to Owners' `pages.owners.contact*` (the same text it always showed).
 */
export async function BuildingsHero({ page, locale }: SectionProps) {
  const t = await getTranslations({ locale, namespace: "pages" });
  const hero = page.content.hero;
  const heroMedia = page.media[hero?.image_media_id ?? ""];
  return (
    <Hero
      background={
        heroMedia ? (
          <MediaImage
            data={heroMedia}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
          <img
            src={BUILDINGS_HERO_IMG}
            alt={BUILDINGS_HERO_ALT}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        )
      }
      compact
      align="center"
      overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
      wrapClassName="mx-auto max-w-[1600px] p-10"
      copyClassName="max-w-none"
      headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
      subtitleClassName="mt-5 max-w-[60ch] text-lg"
      actionsClassName="mt-2"
      eyebrow={orMessage(hero?.eyebrow, t("buildings.heroEyebrow"))}
      headline={orMessage(hero?.headline, t("buildings.heroTitle"))}
      subtitle={orMessage(hero?.copy, t("buildings.heroCopy"))}
      actions={
        <ContactDialog
          variant="light"
          label={orMessage(hero?.contact?.label, t("owners.contactLabel"))}
          title={orMessage(hero?.contact?.title, t("owners.contactTitle"))}
          intro={orMessage(hero?.contact?.intro, t("owners.contactIntro"))}
          source="buildings-hero"
        />
      }
    />
  );
}

/**
 * "For Owners" band under the grid — `core/ui`'s `FeaturePanel`. The `pb`-only wrapper (no
 * `Section`) keeps it flush under the grid above, which already carries the gap. The button
 * always scrolls to the calculator (`#estimate`); a blank contact line is built from Settings
 * with the localized "Call {phone}" prefix, exactly like Owners' closing band.
 */
export async function BuildingsOwnerPanel({ page, locale }: SectionProps) {
  const [t, globals] = await Promise.all([
    getTranslations({ locale, namespace: "pages" }),
    getGlobals(locale),
  ]);
  const panel = page.content.owner_panel;
  const contactLine = ownersFinalContactLine(panel?.contact_line, globals, (phone) =>
    t("owners.finalCall", { phone }),
  );
  return (
    <div className="pb-[clamp(64px,10vw,160px)]">
      <Container>
        <Reveal label="buildings-owner-panel">
          <FeaturePanel
            eyebrow={orMessage(panel?.eyebrow, t("buildings.ownerEyebrow"))}
            title={orMessage(panel?.title, t("buildings.ownerTitle"))}
            body={orMessage(panel?.body, t("buildings.ownerBody"))}
            cta={{ href: "#estimate", label: orMessage(panel?.cta_label, t("buildings.ownerCta")) }}
            contactLine={contactLine}
          />
        </Reveal>
      </Container>
    </div>
  );
}

/**
 * "Numbers That Speak for Themselves" — the shared `core/ui` `StatBand` (Owners/Home), fed the
 * page's 0–8 figures with each one's second line (`description`); desktop columns follow the
 * row count (`statBandColumns`; 3 figures → 3, as always). No figures → nothing, title included.
 */
export async function BuildingsStats({ page, locale }: SectionProps) {
  const cells = describedStatFigureCells(page.content.stats?.figures ?? []);
  if (cells.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "pages" });
  return (
    <Reveal label="buildings-stats">
      <StatBand
        title={orMessage(page.content.stats?.title, t("buildings.statsTitle"))}
        columns={statBandColumns(cells.length)}
        cells={cells}
      />
    </Reveal>
  );
}

/**
 * Earnings calculator — the Owners hero wizard (`OwnerEstimateForm`), two columns (form left,
 * media right on desktop; media first when stacked). Step 1 blank → `pages.buildings.calc*`;
 * steps 2/3 take the same overrides Owners passes (blank → `pages.estimateForm.*`). Media =
 * `sideMedia` (photo / animated WebP / video / Lottie by mime) in the 4:5 frame, else the stock
 * Pexels photo. `#estimate` is the target of the owner panel's button.
 */
export async function BuildingsCalculator({ page, locale }: SectionProps) {
  const t = await getTranslations({ locale, namespace: "pages" });
  const calc = page.content.calculator;
  const calcMedia = page.media[calc?.media_media_id ?? ""];
  return (
    <div id="estimate" className="scroll-mt-[84px]">
      <Section className="border-t border-line bg-[color-mix(in_srgb,var(--color-line)_26%,var(--color-bg))]">
        <Container>
          <Reveal label="buildings-calculator">
            <div className="grid grid-cols-1 items-center gap-[34px] min-[981px]:grid-cols-2 min-[981px]:gap-16">
              <OwnerEstimateForm
                badge={orMessage(calc?.badge, t("buildings.calcBadge"))}
                headline={orMessage(calc?.headline, t("buildings.calcTitle"))}
                subheadline={orMessage(calc?.subheadline, t("buildings.calcSubtitle"))}
                ctaLabel={orMessage(calc?.cta_label, t("buildings.calcCta"))}
                contactTitle={calc?.contact_step?.title}
                contactLede={calc?.contact_step?.lede}
                submitLabel={calc?.contact_step?.submit_label}
                backLabel={calc?.contact_step?.back_label}
                doneTitle={calc?.done_step?.title}
                doneBody={calc?.done_step?.body}
              />
              <div className="order-first min-[981px]:order-none">
                {(calcMedia ? sideMedia(calcMedia) : null) ?? (
                  // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                  <img src={BUILDINGS_CALC_FALLBACK_IMG} alt={BUILDINGS_CALC_FALLBACK_ALT} className={SIDE_MEDIA_CLASS} />
                )}
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </div>
  );
}
