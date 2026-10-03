import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { JsonLd, breadcrumbLd } from "@core/seo";
import { Container, Eyebrow, Section } from "@core/ui";
import { ContactForm } from "@slices/leads/contract";
import { getGlobals } from "@slices/settings/contract";
import {
  getServiceContent,
  SERVICES,
  type ExtraOption,
  type GalleryImage,
  type ItineraryStep,
  type OptionGroup,
  type Partner,
  type PriceTable,
  type ServiceContent,
} from "./service-detail-content";

/**
 * Service detail — the premium design for the 7 real guest services (Airport Transfer,
 * Sintra Tour, Fátima Tour, Boat Tour, Surf Experience, Chef at Home, Luggage Storage).
 * Same `.mk` mock-embed pattern as `ui/services-listing.tsx` and `buildings/ui/building-
 * detail.tsx`: raw markup + page-scoped CSS on kernel variables, static content (see
 * `service-detail-content.ts`) rather than a database read — no ISR tag to bust. The
 * section mix is content-driven: itinerary vs. a menu-style option list vs. a pricing
 * table vs. partner cards, gallery/notes omitted when empty, so every service gets a
 * tailored page without a dozen near-duplicate templates.
 *
 * The one live island is the enquiry form: `leads.ContactForm`, embedded via the leads
 * contract (golden rule 2) rather than a bespoke per-service field matrix — the source
 * sites' own multi-service form conflates unrelated fields (boat options on a tour page,
 * etc.); a simple name/email/message enquiry routed to the guest team is the better guest
 * experience, and matches `booking_type: "enquiry"` in the DB contract's intent.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphsHtml(paras: string[]): string {
  return paras.map((p) => `<p>${esc(p)}</p>`).join("");
}

const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.3l2.6 2.6L16.3 9"/></svg>';

const PAGE_STYLE = `
.mk[data-page="service"] .hero::after{background:linear-gradient(180deg,rgba(18,16,13,.40) 0%,rgba(18,16,13,.28) 45%,rgba(18,16,13,.82) 100%)}
.mk .crumb{font-size:13px;letter-spacing:.02em;color:#ecdcc2;margin-bottom:6px}
.mk .crumb a{color:#ecdcc2;opacity:.85;transition:opacity .2s}
.mk .crumb a:hover{opacity:1;text-decoration:underline}
.mk .crumb span{opacity:.55;margin:0 8px}
.mk .crumb .here{opacity:.7}
.mk .hero p.tagline{font-size:18px;color:#f1ece2;max-width:52ch;margin-bottom:0}
.mk .metabar{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:26px 0;margin-bottom:calc(var(--section-y) * -0.25)}
.mk .metabar .row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px}
.mk .metabar .pills{display:flex;flex-wrap:wrap;gap:12px}
.mk .metabar .pill{font-size:13.5px;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:100px;padding:9px 18px}
.mk .metabar .pill b{font-weight:600}
.mk .prose{max-width:68ch}
.mk .prose p{color:var(--ink-soft);margin-bottom:18px;font-size:17px}
.mk .prose p:last-child{margin-bottom:0}
.mk .hl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px 30px;margin-top:34px;max-width:68ch}
.mk .hl-item{display:flex;gap:12px;align-items:flex-start;font-size:15px;color:var(--ink-soft);line-height:1.5}
.mk .hl-item svg{flex:none;width:19px;height:19px;margin-top:2px;color:var(--accent-deep)}
@media(max-width:680px){.mk .hl-grid{grid-template-columns:1fr}}
.mk .itin{border-left:2px solid var(--line);margin:38px 0 0 6px;max-width:68ch}
.mk .itin-step{position:relative;padding:0 0 30px 30px}
.mk .itin-step:last-child{padding-bottom:0}
.mk .itin-step::before{content:"";position:absolute;left:-7px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--accent);border:3px solid var(--bg)}
.mk .itin-step .time{display:block;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-deep);font-weight:600}
.mk .itin-step h4{font-family:var(--serif);font-size:19px;font-weight:500;margin:6px 0 6px;color:var(--ink)}
.mk .itin-step p{font-size:14.5px;color:var(--ink-soft);line-height:1.65;margin:0}
.mk .opt-group{margin-top:38px;max-width:780px}
.mk .opt-group:first-child{margin-top:34px}
.mk .opt-group h4{font-family:var(--serif);font-size:20px;font-weight:500;margin-bottom:16px;color:var(--ink)}
.mk .opt-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.mk .opt-card{border:1px solid var(--line);border-radius:4px;padding:20px 22px;background:var(--surface)}
.mk .opt-card h5{font-family:var(--serif);font-size:17px;font-weight:500;margin-bottom:6px;color:var(--ink)}
.mk .opt-card p{font-size:13.5px;color:var(--ink-soft);line-height:1.6}
.mk .opt-chips{display:flex;flex-wrap:wrap;gap:10px}
.mk .opt-chip{display:inline-block;border:1px solid var(--line);border-radius:100px;padding:9px 18px;font-size:13.5px;color:var(--ink);background:var(--surface)}
@media(max-width:680px){.mk .opt-cards{grid-template-columns:1fr}}
.mk .price-wrap{overflow-x:auto;margin-top:30px}
.mk table.price-table{width:100%;min-width:420px;border-collapse:collapse}
.mk table.price-table th{text-align:left;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;padding:0 18px 14px 0;border-bottom:1px solid var(--line);white-space:nowrap}
.mk table.price-table td{padding:18px 18px 18px 0;border-bottom:1px solid var(--line);font-size:15px;color:var(--ink);white-space:nowrap}
.mk table.price-table td:first-child{font-weight:500;white-space:normal}
.mk table.price-table td.num{font-family:var(--serif);font-size:18px}
.mk .extras-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:34px}
.mk .extra-card{border:1px solid var(--line);border-radius:4px;padding:20px 22px;background:var(--surface)}
.mk .extra-card .xhead{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.mk .extra-card h5{font-family:var(--serif);font-size:17px;font-weight:500;color:var(--ink)}
.mk .extra-card .xprice{font-size:13.5px;font-weight:600;color:var(--accent-deep);white-space:nowrap}
.mk .extra-card p{margin-top:6px;font-size:13.5px;color:var(--ink-soft);line-height:1.6}
@media(max-width:680px){.mk .extras-grid{grid-template-columns:1fr}}
.mk .partner-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px;margin-top:34px}
.mk .partner-card{border:1px solid var(--line);border-radius:4px;padding:30px;background:var(--surface);display:flex;flex-direction:column;gap:14px}
.mk .partner-card h4{font-family:var(--serif);font-size:22px;font-weight:500;color:var(--ink)}
.mk .partner-card p{font-size:14.5px;color:var(--ink-soft);line-height:1.65;flex:1}
.mk .partner-card .btn{align-self:flex-start}
@media(max-width:680px){.mk .partner-grid{grid-template-columns:1fr}}
.mk .svc-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:34px}
.mk .svc-gallery figure{margin:0;border-radius:4px;overflow:hidden}
.mk .svc-gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
.mk .svc-gallery figcaption{font-size:12.5px;color:var(--ink-soft);margin-top:8px}
.mk .notes{list-style:none;margin-top:28px;max-width:68ch}
.mk .notes li{font-size:14px;color:var(--ink-soft);line-height:1.7;padding-left:20px;position:relative;margin-bottom:11px}
.mk .notes li::before{content:"—";position:absolute;left:0;color:var(--accent-deep)}
.mk .more-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.mk .more-row a{display:inline-block;border:1px solid var(--line);border-radius:100px;padding:10px 20px;font-size:13.5px;color:var(--ink);transition:.2s}
.mk .more-row a:hover{border-color:var(--accent-deep);color:var(--accent-deep)}
`;

function heroHtml(svc: ServiceContent, locale: Locale): string {
  return `
<section class="hero compact" style="padding:0">
  <img src="${esc(svc.heroImage.src)}" alt="${esc(svc.heroImage.alt)}">
  <div class="wrap">
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="/${locale}">Home</a><span>/</span><a href="/${locale}/services">Services</a><span>/</span><span class="here">${esc(svc.name)}</span>
    </nav>
    <span class="eyebrow">${esc(svc.category)}</span>
    <h1>${esc(svc.name)}</h1>
    <p class="tagline">${esc(svc.tagline)}</p>
  </div>
</section>`;
}

function metaBarHtml(svc: ServiceContent): string {
  const pills = [
    svc.durationLabel ? `<span class="pill">${esc(svc.durationLabel)}</span>` : "",
    svc.priceFromLabel ? `<span class="pill"><b>${esc(svc.priceFromLabel)}</b></span>` : "",
  ]
    .filter(Boolean)
    .join("");
  if (!pills) return "";
  return `
<section class="metabar">
  <div class="wrap row">
    <div class="pills">${pills}</div>
    <a class="btn btn-accent" href="#enquire">Enquire Now →</a>
  </div>
</section>`;
}

function highlightsHtml(highlights?: string[]): string {
  if (!highlights?.length) return "";
  return `
<div class="hl-grid reveal">${highlights
    .map((h) => `<div class="hl-item">${CHECK_ICON}<span>${esc(h)}</span></div>`)
    .join("")}</div>`;
}

function itineraryHtml(steps?: ItineraryStep[]): string {
  if (!steps?.length) return "";
  return `
<div class="itin reveal">${steps
    .map(
      (s) =>
        `<div class="itin-step"><span class="time">${esc(s.time)}</span><h4>${esc(s.title)}</h4><p>${esc(s.text)}</p></div>`,
    )
    .join("")}</div>`;
}

function optionGroupsHtml(groups?: OptionGroup[]): string {
  if (!groups?.length) return "";
  return groups
    .map((g) => {
      const withDesc = g.items.some((i) => i.desc);
      const items = withDesc
        ? `<div class="opt-cards">${g.items
            .map((i) => `<div class="opt-card"><h5>${esc(i.name)}</h5>${i.desc ? `<p>${esc(i.desc)}</p>` : ""}</div>`)
            .join("")}</div>`
        : `<div class="opt-chips">${g.items.map((i) => `<span class="opt-chip">${esc(i.name)}</span>`).join("")}</div>`;
      return `<div class="opt-group reveal"><h4>${esc(g.title)}</h4>${items}</div>`;
    })
    .join("");
}

function pricingHtml(pricing?: PriceTable): string {
  if (!pricing) return "";
  const head = `<tr><th></th>${pricing.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
  const rows = pricing.rows
    .map(
      (r) =>
        `<tr><td>${esc(r.label)}</td>${r.cells.map((c) => `<td class="num">${esc(c)}</td>`).join("")}</tr>`,
    )
    .join("");
  const footnote = pricing.footnote ? `<p style="margin-top:14px;font-size:13px;color:var(--ink-soft)">${esc(pricing.footnote)}</p>` : "";
  return `
<div class="price-wrap reveal"><table class="price-table">${head}${rows}</table></div>${footnote}`;
}

function extrasHtml(extras?: ExtraOption[]): string {
  if (!extras?.length) return "";
  return `
<div class="extras-grid reveal">${extras
    .map(
      (e) =>
        `<div class="extra-card"><div class="xhead"><h5>${esc(e.label)}</h5><span class="xprice">${esc(e.price)}</span></div><p>${esc(e.desc)}</p></div>`,
    )
    .join("")}</div>`;
}

function partnersHtml(partners?: Partner[]): string {
  if (!partners?.length) return "";
  return `
<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Our Partners</span>
      <h2 class="section-title">Choose What Suits You</h2>
    </div>
    <div class="partner-grid reveal">${partners
      .map(
        (p) =>
          `<div class="partner-card"><h4>${esc(p.name)}</h4><p>${esc(p.desc)}</p><a class="btn btn-ghost" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.cta)} →</a></div>`,
      )
      .join("")}</div>
  </div>
</section>`;
}

function galleryHtml(images?: GalleryImage[]): string {
  if (!images?.length) return "";
  return `
<section class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Gallery</span>
      <h2 class="section-title">A Closer Look</h2>
    </div>
    <div class="svc-gallery reveal">${images
      .map(
        (g) =>
          `<figure><img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`,
      )
      .join("")}</div>
  </div>
</section>`;
}

function notesHtml(notes?: string[]): string {
  if (!notes?.length) return "";
  return `
<ul class="notes reveal">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;
}

function relatedHtml(current: ServiceContent, locale: Locale): string {
  const others = SERVICES.filter((s) => s.slug !== current.slug);
  if (!others.length) return "";
  return `
<section class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">More Ways We Can Help</span>
      <h2 class="section-title">Other Guest Services</h2>
    </div>
    <div class="more-row reveal">${others
      .map((s) => `<a href="/${locale}/services/${s.slug}">${esc(s.name)}</a>`)
      .join("")}<a href="/${locale}/services">View all services →</a></div>
  </div>
</section>`;
}

function mainContentHtml(svc: ServiceContent, locale: Locale): string {
  const detailSection = svc.intro.length || svc.highlights || svc.itinerary || svc.optionGroups
    ? `
<section>
  <div class="wrap">
    <div class="prose reveal">${paragraphsHtml(svc.intro)}</div>
    ${highlightsHtml(svc.highlights)}
    ${itineraryHtml(svc.itinerary)}
    ${optionGroupsHtml(svc.optionGroups)}
  </div>
</section>`
    : "";

  const pricingSection = svc.pricing
    ? `
<section class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Rates</span>
      <h2 class="section-title">Simple, Transparent Pricing</h2>
    </div>
    ${pricingHtml(svc.pricing)}
    ${extrasHtml(svc.extras)}
  </div>
</section>`
    : "";

  const notesSection = svc.notes?.length
    ? `
<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Good to Know</span>
      <h2 class="section-title">Conditions &amp; Notes</h2>
    </div>
    ${notesHtml(svc.notes)}
  </div>
</section>`
    : "";

  return (
    heroHtml(svc, locale) +
    metaBarHtml(svc) +
    detailSection +
    pricingSection +
    partnersHtml(svc.partners) +
    galleryHtml(svc.gallery) +
    notesSection +
    relatedHtml(svc, locale)
  );
}

/**
 * Renders OUTSIDE the `.mk` wrapper, as a normal `core/ui` + Tailwind section (same
 * shape as `pages/ui/components/lead-cta.tsx`) — not as mock markup. The mock kernel's
 * `.mk * { margin:0; padding:0 }` reset (`app/mock.css`) is unlayered CSS, which always
 * wins over Tailwind's layered utility classes regardless of specificity; nesting the
 * real `ContactForm` (and its Tailwind-styled inputs/labels) inside `.mk` silently
 * stripped their padding/sizing. Living alongside `.mk`, not inside it, keeps this form
 * identical to every other lead-capture form on the site.
 */
async function EnquireSection({ locale, svc }: { locale: Locale; svc: ServiceContent }) {
  const globals = await getGlobals(locale);
  const contactLine = globals
    ? [globals.phone, globals.email, globals.whatsapp ? `WhatsApp ${globals.whatsapp}` : null]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-surface p-8 text-center md:p-14">
          <span id="enquire" className="block scroll-mt-24" aria-hidden />
          <Eyebrow accent>Add This to Your Stay</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
            Enquire About {svc.name}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
            Booked through your dedicated guest contact — tell us your dates and party size and
            we&rsquo;ll confirm availability, price and payment.
          </p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <ContactForm source={`service:${svc.slug}`} />
          </div>
          {contactLine ? <p className="mt-6 text-sm text-ink-soft">{contactLine}</p> : null}
        </div>
      </Container>
    </Section>
  );
}

export async function ServiceDetail({ locale, slug }: { locale: Locale; slug: string }) {
  const svc = getServiceContent(slug);
  if (!svc) notFound();

  const ld = breadcrumbLd([
    { name: "Services", url: `/${locale}/services` },
    { name: svc.name, url: `/${locale}/services/${svc.slug}` },
  ]);

  return (
    <>
      <div className="mk" data-page="service">
        <JsonLd data={ld} />
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <div dangerouslySetInnerHTML={{ __html: mainContentHtml(svc, locale) }} />
      </div>
      <EnquireSection locale={locale} svc={svc} />
    </>
  );
}
