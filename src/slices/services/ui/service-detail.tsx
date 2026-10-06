import { Fragment, type ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import { JsonLd, breadcrumbLd } from "@core/seo";
import {
  ActionBand,
  AmenityGrid,
  Container,
  ContactSplit,
  Hero,
  SectionHead,
  SpecStrip,
  cn,
  type ContactSplitRow,
} from "@core/ui";
import { ContactForm } from "@slices/leads/contract";
import { getGlobals, type SiteGlobals } from "@slices/settings/contract";
import { getServiceBySlug, listServices, type ServiceDetail as ServiceDetailData } from "../contract";
import { RelatedServices } from "./components/related-services";
import { ServiceGallery } from "./components/service-gallery";
import { ServiceItinerary } from "./components/service-itinerary";
import { ServiceNotes } from "./components/service-notes";
import { ServiceOptionGroups } from "./components/service-option-groups";
import { ServicePartners } from "./components/service-partners";
import { ServiceRates } from "./components/service-rates";
import { formatPrice } from "./format";

/**
 * Service detail (`/[locale]/services/[slug]`) — fully componentised JSX (no `.mk`, no
 * `PAGE_STYLE`, no raw HTML, no `mock.css`) and **DB-driven** through the slice contract:
 * `getServiceBySlug(locale, slug)` (ISR-cached, tagged `service-list`, so a publish busts it)
 * for the page and `listServices(locale)` for the "Other Guest Services" row. Every section is
 * content-driven — the rich `detail` sections (highlights, itinerary, options, pricing, extras,
 * partners, notes) and the gallery render only when non-empty, so one template serves a body-only
 * service (Babysitting) as well as a full day tour (Sintra). UI copy comes from the
 * `services.detail.*` messages; DB text is rendered as React text (escaped).
 *
 * Sections, top to bottom (sibling page whose `core/ui` configuration each one mirrors):
 * - Hero: `Hero` with the Buildings listing configuration (as Guides/About/Real Estate), plus
 *   Buildings detail's breadcrumb trail; eyebrow = category, title = name, tagline = excerpt.
 * - Facts strip: `SpecStrip` in a `Container`, as under the Buildings detail hero (duration +
 *   "from" price, cents formatted as EUR by `formatPrice`, with the optional suffix).
 * - Overview: standard page shell; body paragraphs (ProseSection's paragraph style), highlights
 *   as `AmenityGrid` with Buildings detail's check glyph, then the itinerary and option groups
 *   (slice components — no `core/ui` primitive fits).
 * - Rates / Partners / Gallery / Notes / Other services: standard shell + `SectionHead` (eyebrow
 *   + title, left) + a slice component each (see `./components/*`).
 * - Enquiry (`bookingType === "enquiry"` only): About's "Let's Start a Conversation" — standard
 *   shell, `SectionHead`, then `ContactSplit` (guest-team contact rows from company settings
 *   beside the leads `ContactForm`, `source="service:<slug>"`).
 * - External booking (`bookingType === "external"` with a CTA): Buildings detail's closing
 *   `ActionBand`, its button opening the external URL in a new tab. `none` → no closing section.
 *
 * The light sections alternate plain / warm `alt` band in render order (computed, because any
 * of them may be absent), starting plain under the facts strip. Static (no `Reveal`), like the
 * other DB-driven detail pages.
 */

// Standard page shell (Real Estate, Guests, Guides, About): padding, 84px scroll margin,
// 1240px/28px column, and the warm `alt` band.
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

/** Buildings detail's amenity check glyph, reused for the highlights grid. */
const CHECK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.4l2.4 2.4 4.6-5" />
  </svg>
);

const BREADCRUMB_LINK = "opacity-85 transition-opacity duration-200 hover:opacity-100 hover:underline";

/** Body text → paragraphs (blank lines separate them, as authored in the backoffice). */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

type Translate = (key: string) => string;

/** Guest-team contact rows for the enquiry panel, from company settings (omitted when unset). */
function contactRows(globals: SiteGlobals | null, t: Translate): ContactSplitRow[] {
  if (!globals) return [];
  const rows: ContactSplitRow[] = [];
  if (globals.phone) rows.push({ label: t("detail.phone"), value: <a href={telHref(globals.phone)}>{globals.phone}</a> });
  if (globals.whatsapp) {
    rows.push({
      label: t("detail.whatsapp"),
      value: <a href={`https://wa.me/${globals.whatsapp.replace(/\D/g, "")}`}>{globals.whatsapp}</a>,
    });
  }
  if (globals.email) rows.push({ label: t("detail.email"), value: <a href={`mailto:${globals.email}`}>{globals.email}</a> });
  if (globals.officeHours) {
    rows.push({ label: globals.officeHoursLabel || t("detail.hours"), value: globals.officeHours });
  }
  return rows;
}

/** One light section of the page: its key, optional anchor id and body (shell is added later). */
type Block = { key: string; id?: string; body: ReactNode };

function head(eyebrow: string, headline: string) {
  return <SectionHead eyebrow={eyebrow} headline={headline} />;
}

export async function ServiceDetail({ locale, slug }: { locale: Locale; slug: string }) {
  setRequestLocale(locale);

  const svc: ServiceDetailData | null = await getServiceBySlug(locale, slug);
  if (!svc) notFound();

  const enquiry = svc.bookingType === "enquiry";
  const [all, globals, t] = await Promise.all([
    listServices(locale),
    enquiry ? getGlobals(locale) : Promise.resolve(null),
    getTranslations("services"),
  ]);

  const { detail } = svc;
  const paragraphs = splitParagraphs(svc.body);
  const price = formatPrice(svc.priceFrom, locale);
  const facts = [
    svc.durationLabel ? { value: svc.durationLabel, label: t("detail.duration") } : null,
    price ? { value: svc.priceSuffix ? `${price} ${svc.priceSuffix}` : price, label: t("detail.from") } : null,
  ].filter((f): f is { value: string; label: string } => f !== null);
  const others = all.filter((s) => s.id !== svc.id);

  const blocks: Block[] = [];

  if (paragraphs.length || detail.highlights.length || detail.itinerary.length || detail.option_groups.length) {
    blocks.push({
      key: "overview",
      id: "overview",
      body: (
        <>
          {paragraphs.length ? (
            <div className="max-w-[68ch]">
              {paragraphs.map((p, i) => (
                <p key={i} className="mb-[18px] text-[17px] leading-[1.6] text-ink-soft last:mb-0">
                  {p}
                </p>
              ))}
            </div>
          ) : null}
          {detail.highlights.length ? (
            <AmenityGrid
              className={paragraphs.length ? "mt-[46px]" : undefined}
              items={detail.highlights.map((h) => ({ icon: CHECK_ICON, label: h }))}
            />
          ) : null}
          {detail.itinerary.length ? (
            <ServiceItinerary
              steps={detail.itinerary}
              className={paragraphs.length || detail.highlights.length ? "mt-[46px]" : undefined}
            />
          ) : null}
          {detail.option_groups.length ? (
            <ServiceOptionGroups
              groups={detail.option_groups}
              className={
                paragraphs.length || detail.highlights.length || detail.itinerary.length ? "mt-[46px]" : undefined
              }
            />
          ) : null}
        </>
      ),
    });
  }

  if (detail.pricing || detail.extras.length) {
    blocks.push({
      key: "rates",
      id: "rates",
      body: (
        <>
          {head(t("detail.ratesEyebrow"), t("detail.ratesTitle"))}
          <ServiceRates pricing={detail.pricing} extras={detail.extras} />
        </>
      ),
    });
  }

  if (detail.partners.length) {
    blocks.push({
      key: "partners",
      id: "partners",
      body: (
        <>
          {head(t("detail.partnersEyebrow"), t("detail.partnersTitle"))}
          <ServicePartners partners={detail.partners} />
        </>
      ),
    });
  }

  if (svc.gallery.length) {
    blocks.push({
      key: "gallery",
      id: "gallery",
      body: (
        <>
          {head(t("detail.galleryEyebrow"), t("detail.galleryTitle"))}
          <ServiceGallery images={svc.gallery} />
        </>
      ),
    });
  }

  if (detail.notes.length) {
    blocks.push({
      key: "notes",
      id: "notes",
      body: (
        <>
          {head(t("detail.notesEyebrow"), t("detail.notesTitle"))}
          <ServiceNotes notes={detail.notes} />
        </>
      ),
    });
  }

  if (others.length) {
    blocks.push({
      key: "related",
      body: (
        <>
          {head(t("detail.relatedEyebrow"), t("detail.relatedTitle"))}
          <RelatedServices locale={locale} services={others} viewAllLabel={t("detail.viewAll")} />
        </>
      ),
    });
  }

  if (enquiry) {
    blocks.push({
      key: "enquire",
      id: "enquire",
      body: (
        <>
          <SectionHead
            eyebrow={t("detail.enquiryEyebrow")}
            headline={t("detail.enquiryTitle", { name: svc.name })}
            intro={t("detail.enquiryIntro")}
          />
          <ContactSplit
            infoTitle={t("detail.enquiryInfoTitle")}
            rows={contactRows(globals, t)}
            formTitle={t("detail.enquiryFormTitle")}
            formIntro={t("detail.enquiryFormIntro")}
          >
            <ContactForm source={`service:${svc.slug}`} />
          </ContactSplit>
        </>
      ),
    });
  }

  const ld = breadcrumbLd([
    { name: t("breadcrumb"), url: `/${locale}/services` },
    { name: svc.name, url: `/${locale}/services/${svc.slug}` },
  ]);

  return (
    <Fragment>
      <JsonLd data={ld} />
      {/* Hero: Buildings listing's exact `Hero` configuration + Buildings detail's breadcrumb. */}
      <Hero
        background={
          svc.cover ? (
            <MediaImage
              data={svc.cover}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
              sizes="100vw"
              priority
            />
          ) : undefined
        }
        compact
        align="center"
        overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
        wrapClassName="mx-auto max-w-[1600px] p-10"
        copyClassName="max-w-none"
        headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitleClassName="mt-5 max-w-[60ch] text-lg"
        breadcrumb={
          <nav aria-label="Breadcrumb" className="mb-1.5 text-[13px] tracking-[0.02em] text-feature-accent">
            <Link href={`/${locale}`} className={BREADCRUMB_LINK}>
              {t("detail.home")}
            </Link>
            <span className="mx-2 opacity-55">/</span>
            <Link href={`/${locale}/services`} className={BREADCRUMB_LINK}>
              {t("breadcrumb")}
            </Link>
            <span className="mx-2 opacity-55">/</span>
            <span className="opacity-70" aria-current="page">
              {svc.name}
            </span>
          </nav>
        }
        eyebrow={svc.category.name}
        headline={svc.name}
        subtitle={svc.excerpt || undefined}
      />
      {/* Facts strip: Buildings detail's `SpecStrip` (in a `Container`) under the hero. */}
      {facts.length ? (
        <Container>
          <SpecStrip items={facts} />
        </Container>
      ) : null}
      {blocks.map((b, i) => (
        <section key={b.key} id={b.id} className={cn(SECTION_SHELL, i % 2 === 1 && ALT_BAND)}>
          <div className={SECTION_WRAP}>{b.body}</div>
        </section>
      ))}
      {/* External booking: Buildings detail's closing `ActionBand`, opening the partner URL. */}
      {svc.bookingType === "external" && svc.cta ? (
        <ActionBand
          eyebrow={t("detail.bookEyebrow")}
          title={t("detail.bookTitle", { name: svc.name })}
          body={svc.excerpt || undefined}
          cta={{ href: svc.cta.url, label: svc.cta.label, external: /^https?:\/\//i.test(svc.cta.url) }}
          note={t("detail.bookNote")}
        />
      ) : null}
    </Fragment>
  );
}
