import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@core/db/columns";
import { MediaImage } from "@core/media";
import { JsonLd, breadcrumbLd } from "@core/seo";
import { Container, Section } from "@core/ui";
import { getServiceBySlug } from "../contract";
import { formatPrice } from "./format";

/** Service detail: breadcrumb, hero, body, gallery, CTA (booking-type aware). */
export async function ServiceDetail({ locale, slug }: { locale: Locale; slug: string }) {
  setRequestLocale(locale);
  const svc = await getServiceBySlug(locale, slug);
  if (!svc) notFound();

  const t = await getTranslations("services");
  const serviceUrl = `/${locale}/services/${svc.slug}`;
  const price = formatPrice(svc.priceFrom, locale);
  const paragraphs = svc.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const ld = breadcrumbLd([
    { name: t("breadcrumb"), url: `/${locale}/services` },
    { name: svc.name, url: serviceUrl },
  ]);

  return (
    <main>
      <JsonLd data={ld} />

      <Section as="header" className="pb-0">
        <Container>
          <nav className="text-sm text-ink-soft">
            <Link href={`/${locale}/services`} className="hover:text-ink">
              {t("breadcrumb")}
            </Link>
            <span className="px-2">/</span>
            <span className="text-ink">{svc.category.name}</span>
          </nav>

          <span className="mt-6 inline-block text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
            {svc.category.name}
          </span>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-5xl">
            {svc.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{svc.excerpt}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            {price ? <span className="font-medium text-ink">{t("priceFrom", { price })}</span> : null}
            {price && svc.durationLabel ? <span aria-hidden>·</span> : null}
            {svc.durationLabel ? <span>{svc.durationLabel}</span> : null}
          </div>
        </Container>
      </Section>

      {svc.cover ? (
        <Section className="py-12">
          <Container>
            <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-surface">
              <MediaImage
                data={svc.cover}
                priority
                className="h-full w-full object-cover"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="pt-0">
        <Container>
          <article className="mx-auto max-w-3xl">
            {paragraphs.map((p, i) => (
              <p key={i} className="mt-5 text-base leading-relaxed text-ink-soft first:mt-0">
                {p}
              </p>
            ))}

            {svc.cta ? (
              <div className="mt-14 rounded-xl border border-line bg-surface p-8 text-center">
                <a
                  href={svc.cta.url}
                  className="inline-flex items-center justify-center rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
                >
                  {svc.cta.label}
                </a>
              </div>
            ) : svc.bookingType === "enquiry" ? (
              <div className="mt-14 rounded-xl border border-line bg-surface p-8 text-center">
                <h2 className="font-serif text-xl text-ink">{t("enquireTitle")}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                  {t("enquiryNote")}
                </p>
              </div>
            ) : null}
          </article>
        </Container>
      </Section>

      {svc.gallery.length ? (
        <Section className="border-t border-line pt-16">
          <Container>
            <h2 className="font-serif text-2xl text-ink">{t("gallery")}</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {svc.gallery.map((img, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg bg-surface">
                  <MediaImage
                    data={img}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
