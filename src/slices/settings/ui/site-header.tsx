import { getTranslations } from "next-intl/server";
import Image from "next/image";
import topBarLogo from "../../../../logos/Logo Barra Topo bg.png";
import darkTopBarLogo from "../../../../logos/Logo Barra Topo (versão base).png";
import type { Locale } from "@core/db/columns";
import { MobileDrawer, NavBar, buttonClassName, type NavEntry } from "@core/ui";
import { Icon } from "@core/ui/icon";
import { Link } from "@/i18n/navigation";
import { AVANTIO_OWNERS_LOGIN_URL } from "../contract";
import { SITE_ICON_DEFAULTS } from "../site-icons";
import { getGlobals, getNav } from "../server/queries";
import { ContactDialog } from "./components/contact-dialog";
import { HeaderScroll } from "./components/header-scroll";
import { LocaleSwitcher } from "./components/locale-switcher";
import { REAL_ESTATE_SECTIONS } from "./subnav-sections";

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

const HEADER_BOOKING_URL = "https://www.centralhill.pt/en/rentals/holidays-rentals-rentals-d0/";

/**
 * The "Owners" menu reveals the owners-page sections directly, hardcoded rather than read from the
 * DB nav sub-tabs (owner-directed). Hrefs map to the section anchors on the owners page — kept in
 * sync with `slices/pages/ui/owners-page.tsx` (see ADR 0023 updates / drizzle 0004→0007). On the
 * owners page this dropdown doubles as the page's section sub-nav, opened on hover or keyboard
 * navigation; on mobile they appear under "Owners" in the burger drawer.
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
 * Same hover-reveal treatment as `OWNERS_SECTIONS` above (and `REAL_ESTATE_SECTIONS` in
 * `./subnav-sections`), applied to
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
  const [items, globals] = await Promise.all([getNav(locale, "header"), getGlobals(locale)]);
  // Site icons (Settings → "Site icons", ADR 0034 amendment 2). `?? defaults` also covers a
  // globals entry cached before `icons` existed.
  const icons = globals?.icons ?? SITE_ICON_DEFAULTS;

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

  // Real Estate's sub-tab labels are i18n (`settings.subnav.realEstate.*`, list in `./subnav-sections`).
  const realEstateSections = REAL_ESTATE_SECTIONS.map((s) => ({
    label: t(`subnav.realEstate.${s.key}`),
    href: s.href,
  }));

  // Owners', Real Estate's, and About's sub-tabs come from the mock section lists, not the DB.
  const links: NavEntry[] = baseLinks.map((l) => {
    if (l.href === "/owners") return { ...l, children: OWNERS_SECTIONS };
    if (l.href === "/real-estate") return { ...l, children: realEstateSections };
    if (l.href === "/about") return { ...l, children: ABOUT_SECTIONS };
    if (l.href === "/guests") return {
      ...l,
      children: l.children?.map((child) => ({
        ...child,
        label: child.href === "/services" ? t("subnav.guests.services")
          : child.href === "/guides" ? t("subnav.guests.guides") : child.label,
      })),
    };
    return l;
  });

  return (
    <>
      <HeaderScroll />
      <NavBar
        skipLinkLabel={t("skip")}
        brand={
          <Link
            href="/"
            aria-label={t("home")}
            data-brand
            className="inline-flex shrink-0 items-center"
          >
            <Image
              data-header-logo="light"
              src={topBarLogo}
              alt="Central Hill"
              className="h-[47.916px] w-auto md:h-[53.24px]"
              sizes="(min-width: 768px) 189px, 170px"
              priority
            />
            <Image
              data-header-logo="dark"
              src={darkTopBarLogo}
              alt="Central Hill"
              className="h-[47.916px] w-auto md:h-[53.24px]"
              sizes="(min-width: 768px) 189px, 170px"
              loading="eager"
            />
          </Link>
        }
        links={links}
        ctas={
          <>
            {/* Booking opens the requested external rentals page in a new tab. */}
            <a
              href={HEADER_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="ghost"
              className={buttonClassName("ghost", undefined, "sm")}
            >
              {t("ctaBook")}
            </a>
          </>
        }
        utilities={
          <div className="header-utilities">
            <a
              href={AVANTIO_OWNERS_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("ownerLogin")}
              title={t("ownerLogin")}
              data-icon-btn
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <Icon name={icons.account} size={20} />
            </a>
            <ContactDialog
              variant="icon"
              label={t("contact")}
              title={t("contactDialog.title")}
              intro={t("contactDialog.intro")}
              icon={<Icon name={icons.contact} size={20} />}
            />
            <LocaleSwitcher
              current={locale}
              label={t("language")}
              icon={<Icon name={icons.language} size={18} />}
            />
          </div>
        }
        mobileDrawer={
          <MobileDrawer
            links={links}
            loginHref={AVANTIO_OWNERS_LOGIN_URL}
            loginLabel={t("ownerLogin")}
            contactSlot={
              // Keyed: without it React (dev) warns "unique key" when this server-built element
              // renders inside the client drawer.
              <ContactDialog
                key="drawer-contact"
                variant="button"
                label={t("contact")}
                title={t("contactDialog.title")}
                intro={t("contactDialog.intro")}
              />
            }
            book={{ href: HEADER_BOOKING_URL, label: t("ctaBook"), external: true }}
            openLabel={t("menu")}
            closeLabel={t("close")}
          />
        }
      />
    </>
  );
}
