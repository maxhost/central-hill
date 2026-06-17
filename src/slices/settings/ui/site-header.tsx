import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container } from "@core/ui";
import { Link } from "@/i18n/navigation";
import { AVANTIO_OWNERS_LOGIN_URL, avantioBookingUrl } from "../contract";
import { DEFAULT_GLOBALS } from "../defaults";
import { getGlobals, getNav } from "../server/queries";
import { ContactDialog } from "./components/contact-dialog";
import { LocaleSwitcher } from "./components/locale-switcher";
import { MobileNav, type NavEntry } from "./components/mobile-nav";
import { WhatsappFab } from "./components/whatsapp-fab";

/**
 * Site-wide header (app-shell chrome). Renders the primary navigation from the
 * `nav_item` table (location `header`, with one level of sub-tabs); until the
 * backoffice (S12) seeds nav, it falls back to a localized default menu
 * (i18n `settings.nav.*`). Top-level items with children reveal their sub-tabs on
 * hover/focus (client feedback B1 — LovelyStay-style), with no JS (CSS group-hover).
 *
 * The top-right cluster (client feedback B1) carries the Contact form trigger, the
 * Avantio owner-login icon, and the flag language selector. The "Book Now" CTA points
 * at the Avantio engine for the active locale (B2). A floating WhatsApp button hangs
 * over every page. Sticky, frosted, with a hairline base. Mobile uses a drawer.
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

const LIST_HREF = "/owners";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations("settings");
  const [items, globals] = await Promise.all([getNav(locale, "header"), getGlobals(locale)]);
  const g = globals ?? DEFAULT_GLOBALS;

  const links: NavEntry[] = items.length
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

  const bookHref = avantioBookingUrl(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
      >
        {t("skip")}
      </a>
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label={t("home")} className="font-serif text-xl font-semibold text-ink">
          Central<span className="text-accent">Hill</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) =>
            l.children?.length ? (
              <div key={l.href + l.label} className="group relative">
                <Link
                  href={l.href}
                  className="inline-flex items-center gap-1 py-5 text-sm text-ink-soft transition-colors hover:text-ink"
                >
                  {l.label}
                  <span aria-hidden className="text-[0.6rem] text-ink-soft/70">
                    ▾
                  </span>
                </Link>
                <div className="invisible absolute left-1/2 top-full z-50 min-w-44 -translate-x-1/2 rounded-xl border border-line bg-bg p-2 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="flex flex-col">
                    {l.children.map((c) => (
                      <li key={c.href + c.label}>
                        <Link
                          href={c.href}
                          className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-surface hover:text-ink"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
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
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <ContactDialog
            label={t("contact")}
            title={t("contactDialog.title")}
            intro={t("contactDialog.intro")}
          />
          <a
            href={AVANTIO_OWNERS_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("ownerLogin")}
            title={t("ownerLogin")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" />
            </svg>
          </a>
          <LocaleSwitcher current={locale} label={t("language")} />
          <a
            href={bookHref}
            className="inline-flex items-center justify-center rounded-md border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            {t("ctaBook")}
          </a>
          <Link
            href={LIST_HREF}
            className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
          >
            {t("ctaList")} →
          </Link>
        </div>

        <MobileNav
          links={links}
          bookHref={bookHref}
          bookLabel={t("ctaBook")}
          listHref={LIST_HREF}
          listLabel={t("ctaList")}
          loginHref={AVANTIO_OWNERS_LOGIN_URL}
          loginLabel={t("ownerLogin")}
          contactLabel={t("contact")}
          contactTitle={t("contactDialog.title")}
          contactIntro={t("contactDialog.intro")}
          openLabel={t("menu")}
          closeLabel={t("close")}
        />
      </Container>

      {g.whatsapp ? <WhatsappFab phone={g.whatsapp} label={t("whatsappCta")} /> : null}
    </header>
  );
}
