import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { FeatureCtaBand, Hero, IconFeatureGrid, Reveal, SectionHead } from "@core/ui";
import { getGlobals } from "@slices/settings/contract";
import { listServices } from "../contract";
import { ServiceCard } from "./components/service-card";

/**
 * Guest services listing (`mock/services.html`), composed entirely from `core/ui` and slice
 * React components; no `.mk` wrapper, raw HTML strings or page `<style>` remain. Copy comes
 * from the `services.*` messages (all four locales); the cards come from the DB.
 *
 * Sections, top to bottom:
 * - Hero: `Hero` (compact, centred) with exactly the Buildings listing hero configuration
 *   (consistency over mock fidelity, as on Guests and Real Estate). Fixed mock photo.
 * - Services grid: a centred `SectionHead`, then the published services (`listServices`, in
 *   their admin-set `position` order) as this slice's `ServiceCard`, 3 → 2 → 1 columns. An
 *   empty catalogue shows the `services.empty` line instead of the grid.
 * - "How It Works": `IconFeatureGrid`.
 * - Closing CTA: `FeatureCtaBand` with Owners' `#start` configuration. Its contact line is
 *   the `ctaNote` message plus the email/WhatsApp from company_settings (`getGlobals`), so the
 *   contact details are edited once in /admin/settings.
 *
 * Every section uses the standard page shell (`clamp(72px,10vw,150px)` padding, 84px scroll
 * margin, 1240px/28px column). Entrance motion is `Reveal`, with the same `<noscript>` rule
 * as Home/Guests. Iconoir glyphs (card icons, How It Works) still need the stylesheet that
 * `mock.css` `@import`s, which is the only reason the route imports it (parked ADR 0033).
 *
 * ISR: `listServices` is cached under `SERVICE_TAGS.list`, which the services admin publish
 * flow revalidates, so publishing a service refreshes this page.
 */

const HERO_IMG =
  "https://images.unsplash.com/photo-1469022563428-aa04fef9f5a2?auto=format&fit=crop&w=1900&q=70";
const HERO_ALT = "Sunlit Lisbon street with pastel façades and a tram climbing the hill";
const CTA_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70";
const CTA_ALT =
  "Bright, elegantly furnished living room with a city outlook in one of our Lisbon apartments";

const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";

export async function ServicesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [services, globals, t] = await Promise.all([
    listServices(locale),
    getGlobals(locale),
    getTranslations("services"),
  ]);

  // The message ends in a full stop; drop it so the joined line reads "… team · email · …".
  const contactLine = [
    t("ctaNote").replace(/\.$/, ""),
    globals?.email,
    globals?.whatsapp ? `WhatsApp ${globals.whatsapp}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* Hero: Buildings listing's exact `Hero` configuration (see that page). */}
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
      {/* Every `Reveal` renders hidden on the server; this keeps them visible with JS off. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      {/* Services grid: centred `SectionHead`, then the DB-backed `ServiceCard`s. */}
      <section id="services" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              align="center"
              eyebrow={t("gridEyebrow")}
              headline={t("gridTitle")}
              intro={t("gridIntro")}
            />
          </Reveal>
          {services.length > 0 ? (
            <Reveal label="services-grid">
              <div className="grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3">
                {services.map((s, i) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    locale={locale}
                    viewLabel={t("viewDetails")}
                    priority={i < 3}
                  />
                ))}
              </div>
            </Reveal>
          ) : (
            <p className="text-center text-ink-soft">{t("empty")}</p>
          )}
        </div>
      </section>

      <Reveal label="services-how-it-works">
        <IconFeatureGrid
          eyebrow={t("howEyebrow")}
          headline={t("howTitle")}
          items={[
            {
              icon: <i className="iconoir-chat-bubble" aria-hidden="true" />,
              title: t("how1Title"),
              description: t("how1Body"),
            },
            {
              icon: <i className="iconoir-home-simple" aria-hidden="true" />,
              title: t("how2Title"),
              description: t("how2Body"),
            },
            {
              icon: <i className="iconoir-headset" aria-hidden="true" />,
              title: t("how3Title"),
              description: t("how3Body"),
            },
          ]}
        />
      </Reveal>

      {/* Closing CTA: Owners' `#start` `FeatureCtaBand` configuration. */}
      <div id="plan" className="scroll-mt-[84px]">
        <Reveal label="services-cta">
          <FeatureCtaBand
            eyebrow={t("ctaEyebrow")}
            headline={t("ctaTitle")}
            body={t("ctaIntro")}
            cta={{ href: `/${locale}/buildings`, label: `${t("ctaButton")} →` }}
            contactLine={contactLine || undefined}
            image={
              // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
              <img src={CTA_IMG} alt={CTA_ALT} loading="lazy" className="aspect-[4/5] w-full rounded-sm object-cover" />
            }
          />
        </Reveal>
      </div>
    </>
  );
}
