import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { ButtonLink, Container } from "@core/ui";
import { EarningsEstimateForm } from "@slices/leads/contract";
import { getOwnersPage } from "../contract";
import type { OwnersContent } from "../contract";
import { Band, FeatureGrid, SectionHeading, Steps } from "./components/blocks";
import { FaqSection } from "./components/faq-section";
import { PageHero } from "./components/hero";
import { LeadCta } from "./components/lead-cta";
import { StatsBand } from "./components/stats-band";
import { TestimonialsRow } from "./components/testimonials-row";

/**
 * Owners page (content-briefs.md → 1 · Owners). Hero · anchor sub-nav · earnings-estimate
 * CTA (leads, S10) · why · services · plans · journey · dashboard · owner testimonials ·
 * owners FAQ. Stats from settings; the sub-nav anchors are derived from the fixed sections
 * in code (data-model.md). Static (ISR).
 */
export async function OwnersPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const page = await getOwnersPage(locale);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, earnings_form, why, services, plans, journey, dashboard } = content;
  const t = await getTranslations("pages");

  const sections = [
    { id: "why", label: why.headline },
    { id: "services", label: services.headline },
    { id: "plans", label: plans.headline },
    { id: "journey", label: journey.headline },
    { id: "estimate", label: t("owners.navEstimate") },
  ];

  return (
    <main>
      <PageHero
        image={media[hero.image_media_id] ?? null}
        eyebrow={hero.badge}
        headline={hero.headline}
        subtitle={hero.copy}
        actions={<ButtonLink href="#estimate">{t("owners.heroCta")}</ButtonLink>}
      />

      <nav className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
        <Container className="flex gap-6 overflow-x-auto py-4 text-sm">
          {sections.map((s) => (
            <Link
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap text-ink-soft transition-colors hover:text-ink"
            >
              {s.label}
            </Link>
          ))}
        </Container>
      </nav>

      <Band id="why">
        <SectionHeading title={why.headline} />
        <FeatureGrid className="mt-12" items={why.benefits} />
      </Band>

      <Band id="services" className="bg-surface">
        <SectionHeading
          eyebrow={t("owners.servicesEyebrow")}
          title={services.headline}
          intro={services.subheadline}
        />
        <FeatureGrid className="mt-12" items={services.items} />
      </Band>

      <Band id="plans">
        <SectionHeading center title={plans.headline} intro={plans.subheadline} />
        <Plans tiers={plans.tiers} t={t} />
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          {plans.helpers.map((h, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-7">
              <h3 className="font-serif text-xl text-ink">{h.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{h.copy}</p>
              {h.cta ? (
                <Link
                  href={h.cta.url}
                  className="mt-4 inline-block text-sm font-medium text-accent"
                >
                  {h.cta.label}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <ButtonLink href="#estimate">{t("owners.plansCta")}</ButtonLink>
        </div>
      </Band>

      <Band id="journey" className="bg-surface">
        <SectionHeading title={journey.headline} intro={journey.subheadline} />
        <Steps steps={journey.steps} />
      </Band>

      <Band>
        <SectionHeading title={dashboard.headline} intro={dashboard.subheadline} />
        <FeatureGrid className="mt-12" items={dashboard.features} />
      </Band>

      <StatsBand locale={locale} keys={["years", "buildings", "apartments", "revenue"]} />

      <TestimonialsRow locale={locale} audience="owner" />

      <LeadCta
        locale={locale}
        id="estimate"
        eyebrow={t("owners.estimateEyebrow")}
        headline={earnings_form.headline}
        subheadline={earnings_form.subheadline}
        note={earnings_form.note}
        form={<EarningsEstimateForm source="owners" />}
      />

      <FaqSection
        locale={locale}
        groupKey="owners"
        eyebrow={t("faqEyebrow")}
        title={t("owners.faqTitle")}
      />
    </main>
  );
}

/**
 * Management plans (client feedback B8). Cumulative columns (each plan adds to the
 * previous one), each with an optional commission percentage in a circle above the
 * card. The number of plans and the rows per plan are editable in the back office;
 * the grid adapts to however many tiers are authored (up to 4 across on desktop).
 */
function Plans({
  tiers,
  t,
}: {
  tiers: OwnersContent["plans"]["tiers"];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const cols =
    tiers.length >= 4
      ? "lg:grid-cols-4"
      : tiers.length === 3
        ? "lg:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <div className={`mt-16 grid grid-cols-1 gap-6 ${cols}`}>
      {tiers.map((tier, i) => (
        <div
          key={i}
          className={
            tier.is_popular
              ? "relative rounded-2xl border-2 border-accent bg-surface p-8 pt-10"
              : "relative rounded-2xl border border-line bg-surface p-8 pt-10"
          }
        >
          {tier.commission ? (
            <div className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border border-accent bg-bg text-sm font-semibold text-accent shadow-sm">
              {tier.commission}
            </div>
          ) : null}
          {tier.is_popular ? (
            <span className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-surface">
              {t("owners.popular")}
            </span>
          ) : null}
          <h3 className="font-serif text-2xl text-ink">{tier.name}</h3>
          {tier.tag ? <p className="mt-1 text-sm text-ink-soft">{tier.tag}</p> : null}
          {i > 0 ? (
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.1em] text-accent">
              {t("owners.plansCumulative", { prev: tiers[i - 1]!.name })}
            </p>
          ) : null}
          <ul className="mt-4 space-y-3">
            {tier.features.map((f, j) => (
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
