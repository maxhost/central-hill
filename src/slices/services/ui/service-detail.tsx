import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MediaImage, type MediaImageData } from "@core/media";
import type { Locale } from "@core/db/columns";
import { JsonLd, breadcrumbLd } from "@core/seo";
import {
  ContentBlock,
  DetailLayout,
  DetailTitle,
  EnquirySplit,
  IconFactGrid,
  MOSAIC_ADAPTIVE_MAX,
  MosaicGallery,
  SectionHead,
  type EnquiryContactLine,
} from "@core/ui";
import { ContactForm } from "@slices/leads/contract";
import { getGlobals, type SiteGlobals } from "@slices/settings/contract";
import {
  getServiceBySlug,
  listServices,
  type ServiceDetail as ServiceDetailData,
} from "../contract";
import {
  ServiceBookingCard,
  type BookingAction,
} from "./components/service-booking-card";
import { ServiceCard } from "./components/service-card";
import {
  ServiceGoodToKnow,
  ServiceIncluded,
} from "./components/service-good-to-know";
import { FACT_ICON, ICONS } from "./components/service-icons";
import { ServiceItinerary } from "./components/service-itinerary";
import { ServiceMobileBar } from "./components/service-mobile-bar";
import { ServiceOptionGroups } from "./components/service-option-groups";
import { ServicePartners } from "./components/service-partners";
import { ServicePhotos } from "./components/service-photos";
import { ServiceRates } from "./components/service-rates";
import { formatPrice } from "./format";

/**
 * Service detail (`/[locale]/services/[slug]`) — the approved `mock/service-detail.html`: ONE
 * fixed skeleton for every service, fully componentised (no `.mk`, no `mock.css`, no raw HTML)
 * and DB-driven through the slice contract (`getServiceBySlug` → `ServiceDetail`, ISR-cached and
 * tagged `service-list`; `listServices` for "Other guest services"). DB text renders as React
 * text (escaped). UI copy: `services.detail.*`.
 *
 * Skeleton, top to bottom (component → origin):
 * 1. Title block — `core/ui` `DetailTitle`: breadcrumb (Home / Services / name), eyebrow =
 *    category, `<h1>` = name, tagline = excerpt, meta line = ★ rating (+ "Guest favourite" at
 *    ≥ 4.8) and the `badges` (shield glyph each).
 * 2. Gallery — `core/ui` `MosaicGallery adaptive` (cover + gallery, count-aware 1/2/3/4/5
 *    layouts); "Show all photos" (`ServicePhotos` dialog) only when there are more photos than
 *    the mosaic shows.
 * 3. Body — `core/ui` `DetailLayout` (`minmax(0,1fr) 380px`, one column ≤980px):
 *    - content column of `core/ui` `ContentBlock`s: key facts (`IconFactGrid`, `FACT_ICON`
 *      glyphs) · About (eyebrow by category: `experiences` → "experience", else "service"; h2 =
 *      `about_title` or a fallback; body paragraphs) · What's included (`highlights`, h2 =
 *      `included_title` or a fallback) · the **variable module**, only the parts that exist:
 *      itinerary → option groups → rates (+ extras) → partners · Good to know (non-empty
 *      columns only);
 *    - `ServiceBookingCard` (in `core/ui` `StickyAside`): price, note, rows, actions by booking
 *      type — `enquiry`: "Request…" → `#enquire` + "Ask on WhatsApp" (company WhatsApp, when
 *      set) + no-payment note; `external`: the CTA (new tab); `none`: "See partners" → `#partners`
 *      when partners exist.
 *    - `ServiceMobileBar` (≤980px) with the price + the primary action, when there is one.
 * 4. Enquiry (`enquiry` only) — `core/ui` `EnquirySplit` on the warm `alt` band (eyebrow, title,
 *    lede, guest-team contact lines) with the leads `ContactForm` (`source="service:<slug>"`).
 * 5. More services — `SectionHead` + a 4 → 2 → 1 grid of the listing's own `ServiceCard`
 *    (max 4, current excluded). The card's category-icon glyph is an Iconoir class, so the page
 *    loads the Iconoir stylesheet (hoisted `<link>`, the same CDN file `mock.css` `@import`s
 *    for the listing) instead of importing `mock.css`.
 *
 * Static (no `Reveal`), like the other DB-driven detail pages.
 */

const WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND =
  "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";
const ICONOIR_CSS = "https://cdn.jsdelivr.net/npm/iconoir/css/iconoir.css";
const MORE_MAX = 4;

// Gallery `sizes`, per adaptive layout (1184px content column; 10px gaps; 780px breakpoint).
const SIZES_FULL = "(max-width: 1240px) 100vw, 1184px";
const SIZES_LEAD = "(max-width: 780px) 100vw, 582px";
const SIZES_HALF = "(max-width: 780px) 50vw, 582px";
const SIZES_CELL = "(max-width: 780px) 50vw, 291px";

function gallerySizes(count: number, i: number): string {
  if (count === 1) return SIZES_FULL;
  if (count === 2) return SIZES_HALF;
  if (i === 0) return SIZES_LEAD;
  if (count === 3 || (count === 4 && i === 1)) return SIZES_HALF;
  return SIZES_CELL;
}

/** Body text → paragraphs (blank lines separate them, as authored in the backoffice). */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const waHref = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`;

type Translate = (key: string, values?: Record<string, string>) => string;

/** Guest-team contact lines for the enquiry intro, from company settings (omitted when unset). */
function contactLines(
  globals: SiteGlobals | null,
  t: Translate,
): EnquiryContactLine[] {
  if (!globals) return [];
  const lines: EnquiryContactLine[] = [];
  if (globals.phone)
    lines.push({
      label: t("detail.phone"),
      href: telHref(globals.phone),
      text: globals.phone,
    });
  if (globals.whatsapp)
    lines.push({
      label: t("detail.whatsapp"),
      href: waHref(globals.whatsapp),
      text: globals.whatsapp,
    });
  if (globals.email)
    lines.push({
      label: t("detail.email"),
      href: `mailto:${globals.email}`,
      text: globals.email,
    });
  return lines;
}

export async function ServiceDetail({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
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
  const experience = svc.category.slug === "experiences";
  const others = all.filter((s) => s.id !== svc.id).slice(0, MORE_MAX);

  // ---- actions by booking type -------------------------------------------------------------
  let primary: BookingAction | undefined;
  let secondary: BookingAction | undefined;
  let mobileLabel: string | undefined;
  if (enquiry) {
    primary = {
      href: "#enquire",
      label: `${t(experience ? "detail.requestExperience" : "detail.requestService")} →`,
    };
    mobileLabel = t("detail.requestShort");
    if (globals?.whatsapp)
      secondary = {
        href: waHref(globals.whatsapp),
        label: t("detail.whatsappCta"),
      };
  } else if (svc.bookingType === "external" && svc.cta) {
    primary = { href: svc.cta.url, label: `${svc.cta.label} →` };
    mobileLabel = svc.cta.label;
  } else if (detail.partners.length) {
    primary = { href: "#partners", label: `${t("detail.seePartners")} →` };
    mobileLabel = t("detail.seePartners");
  }

  // ---- gallery ---------------------------------------------------------------------------------
  const photos: MediaImageData[] = [
    ...(svc.cover ? [svc.cover] : []),
    ...svc.gallery,
  ];
  const shown = Math.min(photos.length, MOSAIC_ADAPTIVE_MAX);
  const tiles = photos.map((p, i) => (
    <MediaImage
      key={i}
      data={p}
      sizes={gallerySizes(shown, i)}
      priority={i === 0}
    />
  ));
  const showAll =
    photos.length > MOSAIC_ADAPTIVE_MAX ? (
      <ServicePhotos
        label={t("detail.showAllPhotos")}
        title={t("detail.allPhotos")}
        closeLabel={t("detail.close")}
        icon={ICONS.grid}
      >
        {photos.map((p, i) => (
          <MediaImage
            key={i}
            data={p}
            sizes="(max-width: 1040px) 92vw, 912px"
          />
        ))}
      </ServicePhotos>
    ) : undefined;

  // ---- title meta line -------------------------------------------------------------------------
  const meta: ReactNode[] = [];
  if (svc.rating !== null) {
    meta.push(
      <span className="inline-flex items-center gap-1.5 font-semibold [&_svg]:block [&_svg]:size-[15px] [&_svg]:text-accent">
        {ICONS.star}
        {svc.rating.toFixed(1)}
        {svc.rating >= 4.8 ? (
          <span className="font-normal text-ink-soft">
            · {t("detail.guestFavourite")}
          </span>
        ) : null}
      </span>,
    );
  }
  for (const b of detail.badges) {
    meta.push(
      <span className="inline-flex items-center gap-[7px] text-ink-soft [&_svg]:block [&_svg]:size-4 [&_svg]:text-accent-deep">
        {ICONS.shield}
        {b}
      </span>,
    );
  }

  // ---- variable module -------------------------------------------------------------------------
  const gtk = detail.good_to_know;
  const hasKnow =
    gtk.included.length > 0 ||
    gtk.cancellation.length > 0 ||
    gtk.practical.length > 0;

  const ld = breadcrumbLd([
    { name: t("breadcrumb"), url: `/${locale}/services` },
    { name: svc.name, url: `/${locale}/services/${svc.slug}` },
  ]);

  return (
    <>
      <JsonLd data={ld} />
      <link rel="stylesheet" href={ICONOIR_CSS} precedence="default" />

      {/* 1 · title block */}
      <DetailTitle
        breadcrumbLabel={t("detail.breadcrumbLabel")}
        crumbs={[
          { label: t("detail.home"), href: `/${locale}` },
          { label: t("breadcrumb"), href: `/${locale}/services` },
          { label: svc.name },
        ]}
        eyebrow={svc.category.name}
        title={svc.name}
        tagline={svc.excerpt || undefined}
        meta={meta}
      />

      {/* 2 · gallery */}
      {tiles.length ? (
        <div className={WRAP}>
          <MosaicGallery adaptive images={tiles} overlay={showAll} />
        </div>
      ) : null}

      {/* 3 · body: content column + sticky booking card */}
      <DetailLayout
        main={
          <>
            {detail.facts.length ? (
              <ContentBlock>
                <IconFactGrid
                  items={detail.facts.map((f) => ({
                    icon: FACT_ICON[f.icon],
                    title: f.title,
                    note: f.note,
                  }))}
                />
              </ContentBlock>
            ) : null}

            <ContentBlock
              eyebrow={t(
                experience
                  ? "detail.aboutEyebrowExperience"
                  : "detail.aboutEyebrowService",
              )}
              title={detail.about_title ?? t("detail.aboutTitle")}
            >
              {paragraphs.length ? (
                <div>
                  {paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className="mb-4 max-w-[66ch] text-[17px] leading-[1.7] text-ink-soft last:mb-0"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="max-w-[66ch] text-[17px] leading-[1.7] text-ink-soft">
                  {svc.excerpt}
                </p>
              )}
            </ContentBlock>

            {detail.highlights.length ? (
              <ContentBlock
                eyebrow={t("detail.includedEyebrow")}
                title={detail.included_title ?? t("detail.includedTitle")}
              >
                <ServiceIncluded items={detail.highlights} />
              </ContentBlock>
            ) : null}

            {detail.itinerary.length ? (
              <ContentBlock
                id="itinerary"
                eyebrow={t("detail.itineraryEyebrow")}
                title={t("detail.itineraryTitle")}
              >
                <ServiceItinerary
                  steps={detail.itinerary}
                  images={svc.stepImages}
                />
              </ContentBlock>
            ) : null}

            {detail.option_groups.length ? (
              <ContentBlock
                id="options"
                eyebrow={t("detail.optionsEyebrow")}
                title={t("detail.optionsTitle")}
              >
                <ServiceOptionGroups groups={detail.option_groups} />
              </ContentBlock>
            ) : null}

            {detail.pricing || detail.extras.length ? (
              <ContentBlock
                id="rates"
                eyebrow={t("detail.ratesEyebrow")}
                title={t("detail.ratesTitle")}
              >
                <ServiceRates pricing={detail.pricing} extras={detail.extras} />
              </ContentBlock>
            ) : null}

            {detail.partners.length ? (
              <ContentBlock
                id="partners"
                eyebrow={t("detail.partnersEyebrow")}
                title={t("detail.partnersTitle")}
              >
                <ServicePartners partners={detail.partners} />
              </ContentBlock>
            ) : null}

            {hasKnow ? (
              <ContentBlock
                eyebrow={t("detail.knowEyebrow")}
                title={t("detail.knowTitle")}
              >
                <ServiceGoodToKnow
                  data={gtk}
                  labels={{
                    included: t("detail.knowIncluded"),
                    cancellation: t("detail.knowCancellation"),
                    practical: t("detail.knowPractical"),
                  }}
                />
              </ContentBlock>
            ) : null}
          </>
        }
        aside={
          <ServiceBookingCard
            label={t("detail.bookingLabel")}
            fromLabel={t("detail.from")}
            price={price}
            suffix={svc.priceSuffix}
            onRequestLabel={t("detail.onRequest")}
            priceNote={detail.price_note}
            rows={detail.booking_rows}
            primary={primary}
            secondary={secondary}
            note={enquiry ? t("detail.noPayment") : undefined}
          />
        }
      />

      {/* 4 · enquiry (booking type `enquiry` only) */}
      {enquiry ? (
        <div className={ALT_BAND}>
          <EnquirySplit
            id="enquire"
            eyebrow={t("detail.enquiryEyebrow")}
            title={t("detail.enquiryTitle", { name: svc.name })}
            lede={t("detail.enquiryIntro")}
            contact={(() => {
              const lines = contactLines(globals, t);
              return lines.length
                ? { title: t("detail.enquiryInfoTitle"), lines }
                : undefined;
            })()}
          >
            <ContactForm source={`service:${svc.slug}`} />
          </EnquirySplit>
        </div>
      ) : null}

      {/* 5 · more services */}
      {others.length ? (
        <section className="scroll-mt-[84px] py-[clamp(72px,10vw,150px)]">
          <div className={WRAP}>
            <SectionHead
              eyebrow={t("detail.relatedEyebrow")}
              headline={t("detail.relatedTitle")}
            />
            <div className="grid grid-cols-1 gap-[22px] min-[561px]:grid-cols-2 min-[981px]:grid-cols-4">
              {others.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  locale={locale}
                  viewLabel={t("viewDetails")}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {primary && mobileLabel ? (
        <ServiceMobileBar
          price={price ?? t("detail.onRequest")}
          suffix={price ? svc.priceSuffix : null}
          action={{ href: primary.href, label: mobileLabel }}
        />
      ) : null}
    </>
  );
}
