import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { ButtonLink, MobileDrawer, NavBar, type NavEntry } from "@core/ui";
import { Icon } from "@core/ui/icon";
import { Link } from "@/i18n/navigation";
import { AVANTIO_OWNERS_LOGIN_URL } from "../contract";
import { getNav } from "../server/queries";
import { ContactDialog } from "./components/contact-dialog";
import { HeaderScroll } from "./components/header-scroll";
import { LocaleSwitcher } from "./components/locale-switcher";

/**
 * Site-wide header (app-shell chrome). Renders the primary navigation from the
 * `nav_item` table (location `header`, with one level of sub-tabs); until the
 * backoffice (S12) seeds nav, it falls back to a localized default menu
 * (i18n `settings.nav.*`). Top-level items with children reveal their sub-tabs on
 * hover/focus (client feedback B1 — LovelyStay-style), with no JS (CSS group-hover).
 *
 * The top-right cluster carries the Contact form trigger, the Avantio owner-login icon,
 * and the language dropdown. The bar is `fixed`: transparent over a page hero, frosting
 * on scroll (see `globals.css` chrome rules + `HeaderScroll`). Mobile uses a drawer.
 */

/** Default menu (key → route, optional sub-tabs) used when no `nav_item` rows exist yet. */
const DEFAULT_HEADER: Array<{ key: string; href: string; children?: Array<{ key: string; href: string }> }> = [
  { key: "owners", href: "/owners" },
  { key: "buildings", href: "/buildings" },
  { key: "realEstate", href: "/real-estate" },
  {
    key: "guests",
    href: "/guests",
    children: [
      { key: "services", href: "/services" },
      { key: "guides", href: "/guides" },
    ],
  },
  { key: "about", href: "/about" },
  { key: "blog", href: "/blog" },
];

/**
 * On the Owners page the "Owners" mega-menu IS the page's section sub-nav (the page no longer
 * renders its own bar). Two reveal triggers, both also giving the header its frosted background
 * (handled by the hero-chrome rules in `globals.css`): (1) hover — the normal `group-hover`
 * dropdown; (2) scroll — once `[data-site-header]` gains `.scrolled` (past the top) we pin the
 * Owners panel open so it behaves like a sticky section bar. Scoped to the owners page via
 * `body:has([data-page="owners"])`; every other page/menu is untouched. No JS, no kernel edit.
 */
const OWNERS_NAV_CSS = `
body:has([data-page="owners"]) [data-site-header].scrolled [data-nav-item="/owners"] [data-subnav-panel]{
  visibility:visible;opacity:1;
}
`;

/**
 * The "Owners" menu reveals the owners-page sections directly, hardcoded rather than read from the
 * DB nav sub-tabs (owner-directed). Hrefs map to the section anchors on the owners page — kept in
 * sync with `slices/pages/ui/owners-page.tsx` (see ADR 0023 updates / drizzle 0004→0007). On the
 * owners page this dropdown doubles as the page's section sub-nav — opened on hover and pinned open
 * on scroll (see `OWNERS_NAV_CSS`); on mobile they appear under "Owners" in the burger drawer.
 */
const OWNERS_SECTIONS: Array<{ label: string; href: string }> = [
  { label: "What's My Property Worth?", href: "/owners#worth" },
  { label: "Numbers That Speak for Themselves", href: "/owners#numbers" },
  { label: "Why Owners Choose Us", href: "/owners#why" },
  { label: "Everything Done for You", href: "/owners#services" },
  { label: "Find Your Perfect Plan", href: "/owners#plans" },
  { label: "Your Growth Path", href: "/owners#journey" },
  { label: "Full Visibility from Anywhere", href: "/owners#technology" },
  { label: "What Our Owners Say", href: "/owners#testimonials" },
  { label: "Got Questions? We Have Answers.", href: "/owners#faq" },
  { label: "Start Earning More Today", href: "/owners#start" },
];

/**
 * Same hover-reveal treatment as `OWNERS_SECTIONS` above, applied to "Real Estate" — hardcoded
 * rather than read from the DB nav sub-tabs. Hrefs map to the section anchors on the real-estate
 * page — kept in sync with `slices/pages/ui/real-estate-page.tsx` (section ids: top, partners,
 * capabilities, manage, deal-structures, market, track-record, process, faq, deal-enquiry).
 */
const REAL_ESTATE_SECTIONS: Array<{ label: string; href: string }> = [
  { label: "Real Estate Partnerships", href: "/real-estate#top" },
  { label: "Our Partners", href: "/real-estate#partners" },
  { label: "Our Capabilities", href: "/real-estate#capabilities" },
  { label: "What We Manage", href: "/real-estate#manage" },
  { label: "Deal Structures", href: "/real-estate#deal-structures" },
  { label: "Portugal- Market Opportunity", href: "/real-estate#market" },
  { label: "Proven Performance", href: "/real-estate#track-record" },
  { label: "The Process", href: "/real-estate#process" },
  { label: "Questions & Answers", href: "/real-estate#faq" },
  { label: "Start a Conversation", href: "/real-estate#deal-enquiry" },
];

/**
 * Same hover-reveal treatment as `OWNERS_SECTIONS`/`REAL_ESTATE_SECTIONS` above, applied to
 * "About Us" — hardcoded rather than read from the DB nav sub-tabs. Hrefs map to the section
 * anchors on the about page — kept in sync with `slices/pages/ui/about-page.tsx` (section ids:
 * who-we-are, story, serve, values, organised, certifications, community, contact). Note the
 * "values" and "certifications" sections share the same "What We Stand For" eyebrow on the page
 * itself, so that label is intentionally repeated here too.
 */
const ABOUT_SECTIONS: Array<{ label: string; href: string }> = [
  { label: "Who We Are", href: "/about#who-we-are" },
  { label: "How We Started", href: "/about#story" },
  { label: "Our Platform", href: "/about#serve" },
  { label: "What We Stand For", href: "/about#values" },
  { label: "Our Structure", href: "/about#organised" },
  { label: "What We Stand For", href: "/about#certifications" },
  { label: "Our Responsibility", href: "/about#community" },
  { label: "Get in Touch", href: "/about#contact" },
];

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations("settings");
  const items = await getNav(locale, "header");

  const baseLinks: NavEntry[] = items.length
    ? items.map((i) => ({
        label: i.label,
        href: i.url,
        children: i.children.map((c) => ({ label: c.label, href: c.url })),
      }))
    : DEFAULT_HEADER.map((d) => ({
        label: t(`nav.${d.key}`),
        href: d.href,
        children: d.children?.map((c) => ({ label: t(`nav.${c.key}`), href: c.href })),
      }));

  // Owners', Real Estate's, and About's sub-tabs come from the mock section lists (above), not the DB.
  const links: NavEntry[] = baseLinks.map((l) => {
    if (l.href === "/owners") return { ...l, children: OWNERS_SECTIONS };
    if (l.href === "/real-estate") return { ...l, children: REAL_ESTATE_SECTIONS };
    if (l.href === "/about") return { ...l, children: ABOUT_SECTIONS };
    return l;
  });

  return (
    <>
      <HeaderScroll />
      <style>{OWNERS_NAV_CSS}</style>
      <NavBar
        skipLinkLabel={t("skip")}
        brand={
          <Link
            href="/"
            aria-label={t("home")}
            data-brand
            className="font-serif text-xl font-semibold text-ink"
          >
            Central<span className="text-accent">Hill</span>
          </Link>
        }
        links={links}
        ctas={
          <>
            {/*
             * "Book Now" — anchors to the embedded Avantio search bar on Home (hero/stats
             * seam) rather than opening the external Avantio engine — the locale-aware `Link`
             * re-adds the prefix from any page, landing on Home and scrolling to
             * `#booking-engine`.
             */}
            <Link
              href="/#booking-engine"
              data-cta="ghost"
              className="inline-flex items-center gap-2 rounded-[3px] border border-ink px-5 py-[11px] text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-bg"
            >
              {t("ctaBook")}
            </Link>
            {/*
             * "Earn With Us" — the owner-acquisition CTA (client feedback), solid accent fill
             * (`ButtonLink`'s `primary` variant — design-system.md) so it reads as the one
             * standout action next to the outlined "Book Now". Always routes to `/owners` in
             * the active locale.
             */}
            <ButtonLink href={`/${locale}/owners`} className="rounded-[3px] px-5 py-[11px] text-sm">
              {t("ctaEarn")}
            </ButtonLink>
          </>
        }
        utilities={
          <>
            <a
              href={AVANTIO_OWNERS_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("ownerLogin")}
              title={t("ownerLogin")}
              data-icon-btn
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <Icon name="user" size={20} />
            </a>
            <ContactDialog
              variant="icon"
              label={t("contact")}
              title={t("contactDialog.title")}
              intro={t("contactDialog.intro")}
            />
            <LocaleSwitcher current={locale} label={t("language")} />
          </>
        }
        mobileDrawer={
          <MobileDrawer
            links={links}
            loginHref={AVANTIO_OWNERS_LOGIN_URL}
            loginLabel={t("ownerLogin")}
            contactSlot={
              <ContactDialog
                variant="button"
                label={t("contact")}
                title={t("contactDialog.title")}
                intro={t("contactDialog.intro")}
              />
            }
            book={{ href: `/${locale}#booking-engine`, label: t("ctaBook") }}
            earn={{ href: `/${locale}/owners`, label: t("ctaEarn") }}
            openLabel={t("menu")}
            closeLabel={t("close")}
          />
        }
      />
    </>
  );
}
