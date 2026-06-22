import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container } from "@core/ui";
import { Link } from "@/i18n/navigation";
import { AVANTIO_OWNERS_LOGIN_URL, avantioBookingUrl } from "../contract";
import { getNav } from "../server/queries";
import { ContactDialog } from "./components/contact-dialog";
import { HeaderScroll } from "./components/header-scroll";
import { LocaleSwitcher } from "./components/locale-switcher";
import { MobileNav, type NavEntry } from "./components/mobile-nav";

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

  // Owners' sub-tabs come from the mock section list (above), not the DB.
  const links: NavEntry[] = baseLinks.map((l) =>
    l.href === "/owners" ? { ...l, children: OWNERS_SECTIONS } : l,
  );

  return (
    <header
      data-site-header
      className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/85 backdrop-blur transition-colors duration-300"
    >
      <HeaderScroll />
      <style>{OWNERS_NAV_CSS}</style>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
      >
        {t("skip")}
      </a>
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          aria-label={t("home")}
          data-brand
          className="font-serif text-xl font-semibold text-ink"
        >
          Central<span className="text-accent">Hill</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) =>
            l.children?.length ? (
              <div key={l.href + l.label} data-subnav data-nav-item={l.href} className="group">
                <Link
                  href={l.href}
                  className="inline-flex items-center gap-1 py-5 text-sm text-ink-soft transition-colors hover:text-ink"
                >
                  {l.label}
                  <span
                    aria-hidden
                    className="text-[0.6rem] opacity-70 transition-transform duration-200 group-hover:rotate-180"
                  >
                    ▾
                  </span>
                </Link>
                {/*
                 * Sub-tabs as a full-width frosted bar directly under the header (mirrors
                 * mock/home.html owner sub-nav): revealed on hover/focus of this top-level
                 * item. `inset-x-0` resolves against the fixed header → spans its full width.
                 * `data-chrome-keep` opts the bar out of the over-hero white inversion so its
                 * ink-soft links stay readable on the light frosted background.
                 */}
                <div
                  data-chrome-keep
                  data-subnav-panel
                  className="invisible absolute inset-x-0 top-full z-40 border-b border-line bg-bg/95 opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                >
                  <Container className="flex items-center gap-1 overflow-x-auto">
                    {l.children.map((c) => (
                      <Link
                        key={c.href + c.label}
                        href={c.href}
                        className="whitespace-nowrap border-b-2 border-transparent px-4 py-3.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent-deep"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </Container>
                </div>
              </div>
            ) : (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="text-sm text-ink-soft transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            ),
          )}

          {/* "Book Now" lives with the menu (section 2), set off from the links by a margin. */}
          <a
            href={avantioBookingUrl(locale)}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="ghost"
            className="ml-2 inline-flex items-center gap-2 rounded-[3px] border border-ink px-5 py-[11px] text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-bg"
          >
            {t("ctaBook")}
          </a>
        </nav>

        {/* Section 3 — utilities: account access, contact, language. */}
        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={AVANTIO_OWNERS_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("ownerLogin")}
            title={t("ownerLogin")}
            data-icon-btn
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" />
            </svg>
          </a>
          <ContactDialog
            variant="icon"
            label={t("contact")}
            title={t("contactDialog.title")}
            intro={t("contactDialog.intro")}
          />
          <LocaleSwitcher current={locale} label={t("language")} />
        </div>

        <MobileNav
          links={links}
          loginHref={AVANTIO_OWNERS_LOGIN_URL}
          loginLabel={t("ownerLogin")}
          contactLabel={t("contact")}
          contactTitle={t("contactDialog.title")}
          contactIntro={t("contactDialog.intro")}
          book={{ href: avantioBookingUrl(locale), label: t("ctaBook"), external: true }}
          openLabel={t("menu")}
          closeLabel={t("close")}
        />
      </Container>
    </header>
  );
}
