import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { ButtonLink, Container, Eyebrow } from "@core/ui";
import { DealEnquiryForm } from "@slices/leads/contract";
import { getRealEstatePage } from "../contract";
import type { RealEstateContent } from "../contract";
import { Band, FeatureGrid, Prose, SectionHeading, Steps } from "./components/blocks";
import { CountUp } from "./components/count-up";
import { FaqSection } from "./components/faq-section";
import { PageHero } from "./components/hero";
import { TestimonialsRow } from "./components/testimonials-row";

/**
 * Real Estate page (content-briefs.md → 3 · Real Estate). Investor-facing: hero · partners
 * · capabilities · asset classes · investment models · market insight · track record ·
 * process · deal enquiry · FAQ. Marketing copy (partners/capabilities/etc.) is page `data`,
 * not entities (data-model.md). Static (ISR).
 */
export async function RealEstatePage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const page = await getRealEstatePage(locale);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, partners, capabilities, asset_classes, models, market, track_record, process, enquiry } =
    content;
  const t = await getTranslations("pages");

  return (
    <main>
      <PageHero
        image={media[hero.image_media_id] ?? null}
        headline={hero.headline}
        subtitle={hero.subheadline}
        actions={
          <>
            <ButtonLink href={hero.cta_primary.url}>{hero.cta_primary.label}</ButtonLink>
            <ButtonLink href={hero.cta_secondary.url} variant="outline">
              {hero.cta_secondary.label}
            </ButtonLink>
          </>
        }
      />

      <Band>
        <div className="mx-auto max-w-3xl">
          <Prose className="text-center text-lg" text={hero.positioning} />
        </div>
      </Band>

      <Band className="bg-surface">
        <SectionHeading eyebrow={t("realEstate.partnersEyebrow")} title={partners.headline} intro={partners.intro} />
        <FeatureGrid className="mt-12" items={partners.types} columns={2} />
      </Band>

      <Band>
        <SectionHeading title={capabilities.headline} intro={capabilities.intro} />
        <FeatureGrid className="mt-12" items={capabilities.items} />
      </Band>

      <Band className="bg-surface">
        <SectionHeading title={asset_classes.headline} intro={asset_classes.intro} />
        <FeatureGrid className="mt-12" items={asset_classes.items} />
      </Band>

      <Band>
        <SectionHeading center title={models.headline} intro={models.intro} />
        <Models models={models.items} t={t} />
        {models.footer_note ? (
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-soft">
            {models.footer_note}
          </p>
        ) : null}
      </Band>

      <Band className="bg-surface">
        <SectionHeading title={market.headline} intro={market.intro} />
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {market.blocks.map((b, i) => (
            <div key={i} className="rounded-2xl border border-line bg-bg p-7">
              <h3 className="font-serif text-xl text-ink">{b.title}</h3>
              {b.copy ? <Prose className="mt-3" text={b.copy} /> : null}
              {b.bullets ? (
                <ul className="mt-3 space-y-2">
                  {b.bullets.map((bullet, j) => (
                    <li key={j} className="flex gap-2 leading-relaxed text-ink-soft">
                      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </Band>

      <section className="bg-feature py-[clamp(64px,10vw,160px)] text-surface">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl leading-tight md:text-4xl">{track_record.headline}</h2>
            {track_record.intro ? (
              <p className="mt-4 text-lg leading-relaxed text-surface/85">{track_record.intro}</p>
            ) : null}
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 text-center lg:grid-cols-3">
            {track_record.metrics.map((m, i) => (
              <div key={i}>
                <dt className="font-serif text-4xl md:text-5xl">
                  <CountUp value={m.value} />
                </dt>
                <dd className="mt-2 text-sm text-surface/85">{m.label}</dd>
                {m.caption ? <dd className="mt-1 text-xs text-surface/60">{m.caption}</dd> : null}
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Band>
        <SectionHeading title={process.headline} intro={process.intro} />
        <Steps steps={process.steps} />
      </Band>

      <TestimonialsRow locale={locale} audience="owner" />

      <Band className="bg-surface">
        <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-bg p-8 text-center md:p-14">
          <Eyebrow accent>{t("realEstate.enquiryEyebrow")}</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
            {enquiry.headline}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{enquiry.intro}</p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <DealEnquiryForm source="real-estate" />
          </div>
          <p className="mt-6 text-sm text-ink-soft">
            {enquiry.contact_email} · {enquiry.contact_phone} ·{" "}
            <a href={enquiry.contact_linkedin} className="text-accent hover:underline">
              LinkedIn
            </a>
          </p>
        </div>
      </Band>

      <FaqSection
        locale={locale}
        groupKey="real_estate"
        eyebrow={t("faqEyebrow")}
        title={t("realEstate.faqTitle")}
      />
    </main>
  );
}

function Models({
  models,
  t,
}: {
  models: RealEstateContent["models"]["items"];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {models.map((m, i) => (
        <div
          key={i}
          className={
            m.is_featured
              ? "relative rounded-2xl border-2 border-accent bg-surface p-8"
              : "rounded-2xl border border-line bg-surface p-8"
          }
        >
          {m.is_featured ? (
            <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-surface">
              {t("realEstate.featuredModel")}
            </span>
          ) : null}
          <h3 className="font-serif text-2xl text-ink">{m.name}</h3>
          {m.tag ? <p className="mt-1 text-sm text-ink-soft">{m.tag}</p> : null}
          <ul className="mt-6 space-y-3">
            {m.features.map((f, j) => (
              <li key={j} className="flex gap-2 leading-relaxed text-ink-soft">
                <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
