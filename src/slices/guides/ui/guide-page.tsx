import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { JsonLd, breadcrumbLd } from "@core/seo";
import { Container, Section } from "@core/ui";
import { getGuidePage } from "../contract";
import { PlaceCard } from "./components/place-card";

/** Guide-page detail: breadcrumb, hero, then a stack of sections + place grids. */
export async function GuidePageView({
  locale,
  city,
  slug,
}: {
  locale: Locale;
  city: string;
  slug: string;
}) {
  setRequestLocale(locale);
  const guide = await getGuidePage(locale, city, slug);
  if (!guide) notFound();

  const t = await getTranslations("guides");
  const guideUrl = `/${locale}/guides/${guide.city.slug}/${guide.slug}`;

  const ld = breadcrumbLd([
    { name: t("breadcrumb"), url: `/${locale}/guides` },
    { name: guide.city.name, url: `/${locale}/guides` },
    { name: guide.title, url: guideUrl },
  ]);

  return (
    <main>
      <JsonLd data={ld} />

      <Section as="header" className="pb-0">
        <Container>
          <nav className="text-sm text-ink-soft">
            <Link href={`/${locale}/guides`} className="hover:text-ink">
              {t("breadcrumb")}
            </Link>
            <span className="px-2">/</span>
            <span className="text-ink">{guide.city.name}</span>
          </nav>

          <span className="mt-6 inline-block text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
            {guide.city.name}
          </span>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-5xl">
            {guide.title}
          </h1>
          {guide.intro ? (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{guide.intro}</p>
          ) : null}
        </Container>
      </Section>

      {guide.hero ? (
        <Section className="py-12">
          <Container>
            <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-surface">
              <MediaImage
                data={guide.hero}
                priority
                className="h-full w-full object-cover"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            </div>
          </Container>
        </Section>
      ) : null}

      {guide.sections.map((section, i) => {
        const paragraphs = (section.body ?? "")
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);
        return (
          <Section key={section.id} className={i % 2 === 1 ? "bg-surface" : "pt-0"}>
            <Container>
              <div className="max-w-3xl">
                <h2 className="font-serif text-3xl leading-tight text-ink md:text-4xl">
                  {section.title}
                </h2>
                {paragraphs.map((p, pi) => (
                  <p key={pi} className="mt-5 text-base leading-relaxed text-ink-soft">
                    {p}
                  </p>
                ))}
              </div>

              {section.headerImage ? (
                <div className="mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-bg">
                  <MediaImage
                    data={section.headerImage}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 1280px) 100vw, 1200px"
                  />
                </div>
              ) : null}

              {section.localTip ? (
                <div className="mt-8 max-w-3xl rounded-xl border border-line bg-bg p-6">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-accent">
                    {t("localTip")}
                  </span>
                  <p className="mt-2 text-base leading-relaxed text-ink">{section.localTip}</p>
                </div>
              ) : null}

              {section.places.length ? (
                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {section.places.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              ) : null}

              {section.cta ? (
                <div className="mt-10">
                  <a
                    href={section.cta.url}
                    className="inline-flex items-center justify-center rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
                  >
                    {section.cta.label}
                  </a>
                </div>
              ) : null}
            </Container>
          </Section>
        );
      })}

      <Section className="border-t border-line">
        <Container>
          <Link
            href={`/${locale}/guides`}
            className="text-sm font-medium text-accent transition-colors hover:text-accent-deep"
          >
            ← {t("backToGuides")}
          </Link>
        </Container>
      </Section>
    </main>
  );
}
