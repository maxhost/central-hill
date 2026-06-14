import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { ButtonLink, Container, Eyebrow } from "@core/ui";
import { getGlobals } from "@slices/settings/contract";
import { getAboutPage } from "../contract";
import { Band, FeatureGrid, SectionHeading } from "./components/blocks";
import { PageHero } from "./components/hero";
import { StatsBand } from "./components/stats-band";

/**
 * About page (content-briefs.md → 5 · About). Hero · story · who we serve · values ·
 * organisation · certifications · community · contact (leads, S10). Stats band + office
 * block from settings; team/partners/certifications are static page copy (data-model.md).
 * Static (ISR).
 */
export async function AboutPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, globals] = await Promise.all([getAboutPage(locale), getGlobals(locale)]);
  if (!page) notFound();

  const { content, media } = page;
  const { hero, story, serve, values, organisation, certifications, community, contact } = content;
  const t = await getTranslations("pages");

  return (
    <main>
      <PageHero
        image={media[hero.image_media_id] ?? null}
        eyebrow={hero.eyebrow}
        headline={hero.headline}
        subtitle={hero.mission}
      />

      <Band>
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow={story.eyebrow} title={story.headline} />
          <div className="mt-6 space-y-4">
            {story.narrative.map((p, i) => (
              <p key={i} className="leading-relaxed text-ink-soft">
                {p}
              </p>
            ))}
          </div>
        </div>
      </Band>

      <StatsBand locale={locale} keys={["years", "buildings", "guests", "revenue"]} />

      <Band className="bg-surface">
        <SectionHeading center title={serve.headline} intro={serve.intro} />
        <FeatureGrid className="mt-12" items={serve.audiences} />
      </Band>

      <Band>
        <SectionHeading title={values.headline} intro={values.intro} />
        <FeatureGrid className="mt-12" items={values.items} columns={2} />
      </Band>

      <Band className="bg-surface">
        <SectionHeading eyebrow={organisation.eyebrow} title={organisation.headline} intro={organisation.intro} />
        <FeatureGrid
          className="mt-12"
          items={organisation.departments.map((d) => ({ title: d.name, description: d.description }))}
        />
      </Band>

      <Band>
        <SectionHeading title={certifications.headline} intro={certifications.intro} />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {certifications.items.map((c, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-7">
              <h3 className="font-serif text-lg text-ink">{c.title}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-accent">{c.issuer}</p>
              <p className="mt-3 leading-relaxed text-ink-soft">{c.description}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band className="bg-surface">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          {media[community.image_media_id] ? (
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-bg">
              <MediaImage
                data={media[community.image_media_id]!}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : null}
          <div>
            <Eyebrow accent>{community.eyebrow ?? t("about.communityEyebrow")}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
              {community.headline}
            </h2>
            <div className="mt-5 space-y-4">
              {community.copy.map((p, i) => (
                <p key={i} className="leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Band>

      <section className="py-[clamp(64px,10vw,160px)]">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl leading-tight text-ink md:text-4xl">{contact.headline}</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <ButtonLink href={contact.cta_guests.url}>{contact.cta_guests.label}</ButtonLink>
              <ButtonLink href={contact.cta_owners.url} variant="outline">
                {contact.cta_owners.label}
              </ButtonLink>
              <ButtonLink href={contact.cta_partners.url} variant="outline">
                {contact.cta_partners.label}
              </ButtonLink>
            </div>

            <div className="mt-12 rounded-3xl border border-line bg-surface p-8 md:p-12">
              <h3 className="font-serif text-2xl text-ink">{contact.form.headline}</h3>
              {contact.form.subheadline ? (
                <p className="mx-auto mt-3 max-w-xl text-ink-soft">{contact.form.subheadline}</p>
              ) : null}
              {globals ? (
                <p className="mt-6 text-sm text-ink-soft">
                  {[globals.phone, globals.email, globals.whatsapp].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {globals?.officeAddress ? (
                <p className="mt-2 text-sm text-ink-soft">
                  {[globals.officeHoursLabel, globals.officeAddress].filter(Boolean).join(" — ")}
                </p>
              ) : null}
              <p className="mt-4 text-xs uppercase tracking-[0.14em] text-ink-soft">
                {t("about.contactNote")}
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
