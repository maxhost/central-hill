import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@core/db/columns";
import { mediaImgTag, type MediaImageData } from "@core/media";
import { getGlobals } from "@slices/settings/contract";
import { getGuestPage, type GuestContent } from "../contract";
import { FaqSection } from "./components/faq-section";
import { FeaturedPortfolio } from "./components/featured-portfolio";
import { TestimonialsRow } from "./components/testimonials-row";

/**
 * Guests page — the approved `mock/guest.html` layout inside the live app shell, now fully
 * DB-driven (docs/specs/guest-page-db-wiring.md). The mock's body markup is rendered as a
 * scoped HTML string (page-only styles under `.mk`; the shared design system lives in
 * `src/app/mock.css`) with every text/image value interpolated from the `guest`
 * `page_content` row, resolved for the locale. Nothing on this page is hard-coded copy.
 *
 * Composed from other slices at render time, so publishing there refreshes this page:
 *   - featured portfolio cards → buildings (`FeaturedPortfolio`)
 *   - guest reviews → testimonials, `audience='guest'` (`TestimonialsRow`, /admin/testimonials)
 *   - optional FAQ accordion → faq, chosen per page via `faq_group_key`
 *   - dual-CTA contact line (phone / email / WhatsApp) → company_settings (`getGlobals`)
 * Those three React islands render OUTSIDE the `.mk` wrapper so `mock.css`'s bare-element
 * rules don't leak into their Tailwind markup; the static body is split around them.
 *
 * The hero <video> is the mock's markup (autoplay/muted/loop); no client JS is wired, so
 * `.reveal` is neutralised in mock.css and all content renders immediately.
 */

// Media fallbacks = the approved mock assets, used 1:1 until a real R2 asset is set in the
// backoffice (`*_media_id` may be blank, or seeded to an id with no uploaded asset yet).
const HERO_FALLBACK_VIDEO =
  "https://videos.pexels.com/video-files/16592055/16592055-hd_1920_1080_60fps.mp4";
const HERO_FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1900&q=72";
const WELCOME_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70";
const WELCOME_FALLBACK_ALT = "Bright, design-led Central Hill apartment interior";
// The welcome photo is the narrower of two columns in the 1240px `.wrap` (.95fr of
// 1.05fr/.95fr with a 56px gap) and goes full-width under 880px — see `.welcome`.
const WELCOME_SIZES = "(max-width: 880px) 100vw, 540px";

// Escape admin-authored content before it is interpolated into the static body HTML string.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

/**
 * Iconoir glyph class for a card's `icon_key`. The font is loaded globally by `mock.css`, so
 * a valid key renders directly. Unknown/legacy keys (e.g. the demo seed's `"spark"`) fall
 * back to the decorative `sparks` glyph rather than rendering an empty box.
 */
const ICON_FALLBACK = "iconoir-sparks";
const iconClass = (key: string): string =>
  key.length > 0 && key.length <= 64 && /^[a-z0-9-]+$/.test(key)
    ? `iconoir-${key}`
    : ICON_FALLBACK;

/**
 * Rewrite an own-site `/en/…` CTA link to the active locale. Stored CTA urls must be absolute
 * (`cta.url` is `z.url()`, so a relative path cannot be saved) and are authored in English, so
 * without this a Portuguese visitor would be sent to the English route. External links and
 * anything unparseable pass through untouched.
 */
function localizeUrl(raw: string, locale: Locale): string {
  try {
    const u = new URL(raw);
    if (!/(^|\.)centralhill\.pt$/.test(u.hostname)) return raw;
    u.pathname = u.pathname.replace(/^\/(en|pt|es|fr)(?=\/|$)/, `/${locale}`);
    return u.toString();
  } catch {
    return raw;
  }
}

/** Split an admin-authored multi-paragraph field into escaped `<p>` blocks. */
const paragraphs = (copy: string, attrs = ""): string =>
  copy
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p${attrs}>${esc(block)}</p>`)
    .join("");

type IconCard = { icon_key: string; title: string; description: string };
type Cta = { label: string; url: string; note?: string };

/** The mock's icon card, in either of its two wrappers (`.bcard` for Why, `.feat` for teasers). */
const iconCards = (items: IconCard[], wrapper: "bcard" | "feat"): string =>
  items
    .map(
      (c) =>
        `<div class="${wrapper}"><i class="ico ${iconClass(c.icon_key)}" aria-hidden="true"></i>` +
        `<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p></div>`,
    )
    .join("");

/** The mock's centred section header (eyebrow + title + lede); optional parts are omitted. */
const secHead = (opts: { eyebrow?: string; headline: string; intro?: string }): string =>
  `<div class="sec-head center reveal">
      ${opts.eyebrow ? `<span class="eyebrow">${esc(opts.eyebrow)}</span>` : ""}
      <h2 class="section-title">${esc(opts.headline)}</h2>
      ${opts.intro ? `<p class="lede" style="margin:16px auto 0">${esc(opts.intro)}</p>` : ""}
    </div>`;

/** The mock's centred CTA row (button + optional helper note). */
const ctaRow = (cta: Cta, locale: Locale, variant: "accent" | "ghost"): string =>
  `<div class="cta-row reveal" style="justify-content:center">` +
  `<a class="btn btn-${variant}" href="${escAttr(localizeUrl(cta.url, locale))}">${esc(cta.label)} →</a>` +
  `${cta.note ? `<span class="cta-note">${esc(cta.note)}</span>` : ""}</div>`;

const PAGE_STYLE = `
.mk .ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}
.mk .welcome{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.mk .welcome img{width:100%;height:100%;object-fit:cover;min-height:380px}
.mk .welcome .guarantee{margin-top:22px;font-weight:600;color:var(--accent-deep);font-size:16px;display:inline-flex;align-items:center;gap:10px}
.mk .welcome .guarantee i{font-size:22px}
.mk .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.mk .feat{background:var(--surface);border:1px solid var(--line);padding:34px 30px}
.mk .feat h3{font-size:20px;margin-bottom:8px}
.mk .feat p{font-size:14.5px;color:var(--ink-soft)}
@media(max-width:880px){.mk .welcome{grid-template-columns:1fr;gap:32px}.mk .welcome img{min-height:280px}.mk .feat-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.mk .feat-grid{grid-template-columns:1fr}}
`;

/** Hero · Welcome · Why book directly — above the featured-portfolio island. */
function bodyTop(
  content: GuestContent,
  media: Record<string, MediaImageData>,
  locale: Locale,
): string {
  const { hero, welcome, why } = content;
  const heroVideo = media[hero.video_media_id ?? ""]?.url ?? HERO_FALLBACK_VIDEO;
  const welcomeImgTag = mediaImgTag({
    data: media[welcome.image_media_id ?? ""],
    fallbackSrc: WELCOME_FALLBACK_IMG,
    fallbackAlt: WELCOME_FALLBACK_ALT,
    sizes: WELCOME_SIZES,
  });

  return `
<!-- HERO -->
<section class="hero compact" style="padding:0">
  <video autoplay muted loop playsinline poster="${escAttr(HERO_FALLBACK_POSTER)}">
    <source src="${escAttr(heroVideo)}" type="video/mp4">
  </video>
  <div class="wrap">
    ${hero.eyebrow ? `<span class="eyebrow">${esc(hero.eyebrow)}</span>` : ""}
    <h1>${esc(hero.headline)}</h1>
    ${hero.subheadline ? `<p>${esc(hero.subheadline)}</p>` : ""}
    <div class="hero-cta">
      <a class="btn btn-accent" href="${escAttr(localizeUrl(hero.cta.url, locale))}">${esc(hero.cta.label)} →</a>
    </div>
  </div>
</section>

<!-- WELCOME -->
<section>
  <div class="wrap">
    <div class="welcome reveal">
      <div>
        <h2 class="section-title">${esc(welcome.headline)}</h2>
        <p class="lede" style="margin-top:18px">${esc(welcome.lede)}</p>
        ${paragraphs(welcome.copy, ' style="margin-top:14px;color:var(--ink-soft)"')}
        ${
          welcome.guarantee_label
            ? `<span class="guarantee"><i class="iconoir-percentage-circle" aria-hidden="true"></i> ${esc(welcome.guarantee_label)}</span>`
            : ""
        }
      </div>
      ${welcomeImgTag}
    </div>
  </div>
</section>

<!-- WHY BOOK DIRECTLY -->
<section class="alt">
  <div class="wrap">
    ${secHead({ eyebrow: why.eyebrow, headline: why.headline, intro: why.intro })}
    <div class="grid-3 reveal" style="grid-template-columns:repeat(4,1fr)">
      ${iconCards(why.benefits, "bcard")}
    </div>
    ${ctaRow(why.cta, locale, "accent")}
  </div>
</section>
`;
}

/** Services teaser · What-to-do teaser — between the portfolio and testimonials islands. */
function bodyMid(content: GuestContent, locale: Locale): string {
  const { services_teaser: services, activities_teaser: activities } = content;

  return `
<!-- SERVICES TEASER -->
<section class="alt">
  <div class="wrap">
    ${secHead({ eyebrow: services.eyebrow, headline: services.headline, intro: services.intro })}
    <div class="feat-grid reveal">
      ${iconCards(services.items, "feat")}
    </div>
    ${ctaRow(services.cta, locale, "accent")}
  </div>
</section>

<!-- WHAT TO DO TEASER -->
<section>
  <div class="wrap">
    ${secHead({ eyebrow: activities.eyebrow, headline: activities.headline, intro: activities.intro })}
    <div class="feat-grid reveal">
      ${iconCards(activities.items, "feat")}
    </div>
    ${ctaRow(activities.cta, locale, "ghost")}
  </div>
</section>
`;
}

/**
 * Closing owner/guest dual CTA. Panel copy is admin-authored; the contact line is built from
 * the company_settings singleton (data-model.md → dual-CTA = company_settings), so the phone,
 * email and WhatsApp are edited once in /admin/settings and never duplicated per page.
 */
function bodyBottom(
  content: GuestContent,
  globals: Awaited<ReturnType<typeof getGlobals>>,
  locale: Locale,
): string {
  const { guest, owner } = content.dual_cta;
  const guestContact = globals ? [globals.phone, globals.email].filter(Boolean).join(" · ") : "";
  const ownerContact = globals
    ? [globals.phone, globals.email, globals.whatsapp ? `WhatsApp ${globals.whatsapp}` : null]
        .filter(Boolean)
        .join(" · ")
    : "";

  const panel = (
    p: typeof guest,
    modifier: string,
    variant: "solid" | "accent",
    contact: string,
  ): string =>
    `<div class="dcol${modifier}">
        ${p.eyebrow ? `<span class="eyebrow">${esc(p.eyebrow)}</span>` : ""}<h3>${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
        <a class="btn btn-${variant}" href="${escAttr(localizeUrl(p.cta.url, locale))}">${esc(p.cta.label)} →</a>
        ${contact ? `<div class="contact-line">${esc(contact)}</div>` : ""}
      </div>`;

  return `
<!-- DUAL CTA -->
<section>
  <div class="wrap">
    <div class="dual reveal">
      ${panel(guest, "", "solid", guestContact)}
      ${panel(owner, " owner", "accent", ownerContact)}
    </div>
  </div>
</section>
`;
}

export async function GuestPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, globals, t] = await Promise.all([
    getGuestPage(locale),
    getGlobals(locale),
    getTranslations("pages"),
  ]);
  if (!page) notFound();

  const { content, media } = page;
  const { portfolio } = content;
  const faqGroupKey = content.faq_group_key ?? "";

  return (
    <>
      <div className="mk" data-page="guests">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <div dangerouslySetInnerHTML={{ __html: bodyTop(content, media, locale) }} />
      </div>

      {/* Featured properties — cards from the buildings slice, headings from `guest.portfolio`. */}
      <div id="portfolio" style={{ scrollMarginTop: 130 }}>
        <FeaturedPortfolio
          locale={locale}
          eyebrow={portfolio.eyebrow}
          title={portfolio.headline}
          intro={portfolio.intro}
          ctaLabel={portfolio.cta.label}
          ctaNote={portfolio.cta.note}
          ctaHref={localizeUrl(portfolio.cta.url, locale)}
        />
      </div>

      <div className="mk" data-page="guests">
        <div dangerouslySetInnerHTML={{ __html: bodyMid(content, locale) }} />
      </div>

      {/* Guest reviews — the same shared marquee as Home/Owners, filtered to `audience='guest'`. */}
      <div id="testimonials" style={{ scrollMarginTop: 130 }}>
        <TestimonialsRow locale={locale} audience="guest" title={t("reviews.titleGuests")} />
      </div>

      {faqGroupKey ? (
        <div id="faq" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            eyebrow={t("faqEyebrow")}
            title={t("faqTitle")}
          />
        </div>
      ) : null}

      <div className="mk" data-page="guests">
        <div dangerouslySetInnerHTML={{ __html: bodyBottom(content, globals, locale) }} />
      </div>
    </>
  );
}
