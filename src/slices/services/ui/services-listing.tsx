import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { Container, Eyebrow, Section } from "@core/ui";
import { listServiceCategories, listServices } from "../contract";
import { ServiceCard } from "./components/service-card";
import { ServiceFilter } from "./components/service-filter";

/** Services index: hero + category-filtered card grid + how-it-works + CTA band. */
export async function ServicesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations("services");

  const [services, categories] = await Promise.all([
    listServices(locale),
    listServiceCategories(locale),
  ]);

  // Only show category filters that actually have published services.
  const usedSlugs = new Set(services.map((s) => s.category.slug));
  const filterCategories = categories
    .filter((c) => usedSlugs.has(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name }));

  const items = services.map((s, i) => ({
    id: s.id,
    category: s.category.slug,
    node: <ServiceCard service={s} locale={locale} priority={i < 3} />,
  }));

  const howItems = [
    { title: t("how1Title"), body: t("how1Body") },
    { title: t("how2Title"), body: t("how2Body") },
    { title: t("how3Title"), body: t("how3Body") },
  ];

  return (
    <main>
      <Section as="header" className="pb-0">
        <Container>
          <Eyebrow accent>{t("eyebrow")}</Eyebrow>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow accent>{t("gridEyebrow")}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
              {t("gridTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">{t("gridIntro")}</p>
          </div>

          <div className="mt-12">
            {items.length ? (
              <ServiceFilter categories={filterCategories} items={items} allLabel={t("all")} />
            ) : (
              <p className="text-center text-ink-soft">{t("empty")}</p>
            )}
          </div>
        </Container>
      </Section>

      <Section className="bg-surface">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow accent>{t("howEyebrow")}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
              {t("howTitle")}
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {howItems.map((h) => (
              <div key={h.title}>
                <h3 className="font-serif text-xl text-ink">{h.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{h.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-feature text-bg">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>{t("ctaEyebrow")}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">{t("ctaTitle")}</h2>
            <p className="mt-4 text-base leading-relaxed text-bg/80">{t("ctaIntro")}</p>
            <Link
              href={`/${locale}/buildings`}
              className="mt-8 inline-flex items-center justify-center rounded-md bg-bg px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface"
            >
              {t("ctaButton")} →
            </Link>
            <p className="mt-5 text-xs text-bg/60">{t("ctaNote")}</p>
          </div>
        </Container>
      </Section>
    </main>
  );
}
