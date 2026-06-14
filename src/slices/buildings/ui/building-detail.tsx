import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { JsonLd, breadcrumbLd } from "@core/seo";
import { ButtonLink, Container, Eyebrow, Section } from "@core/ui";
import { getBuildingBySlug } from "../contract";
import type { BuildingDetail as BuildingDetailModel } from "../contract";

/**
 * Building detail (content-briefs.md → 2 · Buildings, LovelyStay-style): hero
 * (name + address + NEW badge) · stats (apartments · capacity · beds) · gallery ·
 * "The Building" + "The Neighbourhood" prose · amenities · FAQ · "Book an apartment"
 * CTA (Avantio). Emits BreadcrumbList JSON-LD.
 *
 * NOTE (escalation): a richer `LodgingBusiness`/`Apartment` JSON-LD builder belongs
 * in the kernel `core/seo` (ADR required, golden rule 3) — not hand-written here.
 * Until then we emit the available BreadcrumbList only. Tracked in README → Deferred.
 */
export async function BuildingDetail({ locale, slug }: { locale: Locale; slug: string }) {
  setRequestLocale(locale);
  const b = await getBuildingBySlug(locale, slug);
  if (!b) notFound();

  const t = await getTranslations("buildings");
  const url = `/${locale}/buildings/${b.slug}`;

  const ld = [
    breadcrumbLd([
      { name: t("breadcrumb"), url: `/${locale}/buildings` },
      { name: b.name, url },
    ]),
  ];

  return (
    <main>
      <JsonLd data={ld} />

      <Section as="header" className="pb-0">
        <Container>
          <nav className="text-sm text-ink-soft">
            <Link href={`/${locale}/buildings`} className="hover:text-ink">
              {t("breadcrumb")}
            </Link>
            <span className="px-2">/</span>
            <span className="text-ink">{b.name}</span>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {b.isNew ? (
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-bg">
                {t("new")}
              </span>
            ) : null}
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {[b.neighbourhood?.name, b.city.name].filter(Boolean).join(" · ")}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-5xl">
            {b.name}
          </h1>
          {b.headline ? (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{b.headline}</p>
          ) : null}
          {b.streetAddress ? (
            <p className="mt-3 text-sm text-ink-soft">{b.streetAddress}</p>
          ) : null}

          <BuildingStats stats={b.stats} t={t} />
        </Container>
      </Section>

      <Gallery building={b} />

      <Section className="pt-0">
        <Container>
          <div className="mx-auto max-w-3xl">
            {b.descriptionIntro ? (
              <section>
                <Eyebrow accent>{t("theBuilding")}</Eyebrow>
                <Prose text={b.descriptionIntro} />
              </section>
            ) : null}

            {b.descriptionNeighbourhood ? (
              <section className="mt-14">
                <Eyebrow accent>{t("theNeighbourhood")}</Eyebrow>
                <Prose text={b.descriptionNeighbourhood} />
              </section>
            ) : null}

            {b.amenities.length ? (
              <section className="mt-16">
                <h2 className="font-serif text-2xl text-ink">{t("amenities")}</h2>
                <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  {b.amenities.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-ink-soft">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                      {a.label}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {b.faq.length ? (
              <section className="mt-16">
                <h2 className="font-serif text-2xl text-ink">{t("faq")}</h2>
                <dl className="mt-6 divide-y divide-line border-t border-line">
                  {b.faq.map((f) => (
                    <div key={f.id} className="py-5">
                      <dt className="font-medium text-ink">{f.question}</dt>
                      <dd className="mt-2 leading-relaxed text-ink-soft">{f.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section className="mt-16 rounded-xl border border-line bg-surface p-8 text-center">
              <h2 className="font-serif text-2xl text-ink">{t("bookTitle")}</h2>
              <p className="mx-auto mt-3 max-w-xl text-ink-soft">{t("bookIntro")}</p>
              {b.avantio.url ? (
                <div className="mt-6">
                  <ButtonLink href={b.avantio.url}>{t("bookCta")}</ButtonLink>
                </div>
              ) : null}
            </section>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function BuildingStats({
  stats,
  t,
}: {
  stats: BuildingDetailModel["stats"];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const cells = [
    { value: stats.apartments, label: t("statApartments") },
    { value: stats.capacity, label: t("statCapacity") },
    { value: stats.beds, label: t("statBeds") },
  ];
  return (
    <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-6">
      {cells.map((c) => (
        <div key={c.label}>
          <dt className="text-xs uppercase tracking-[0.12em] text-ink-soft">{c.label}</dt>
          <dd className="mt-1 font-serif text-3xl text-ink">{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Gallery({ building }: { building: BuildingDetailModel }) {
  const images = building.gallery.length
    ? building.gallery
    : building.cover
      ? [building.cover]
      : [];
  if (!images.length) return null;

  const [hero, ...rest] = images;
  return (
    <Section className="py-12">
      <Container>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface md:row-span-2 md:aspect-auto">
            <MediaImage
              data={hero!}
              priority
              className="h-full w-full object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {rest.slice(0, 2).map((img, i) => (
            <div key={i} className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
              <MediaImage
                data={img}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Plain-paragraph prose: split on blank lines (descriptions are plain [T] text). */
function Prose({ text }: { text: string }) {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="mt-4 space-y-4">
      {paras.map((p, i) => (
        <p key={i} className="leading-relaxed text-ink-soft">
          {p}
        </p>
      ))}
    </div>
  );
}
