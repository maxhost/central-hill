import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container } from "@core/ui";
import { Link } from "@/i18n/navigation";
import { getNav } from "../server/queries";
import { MobileNav, type NavEntry } from "./components/mobile-nav";

/**
 * Site-wide header (app-shell chrome). Renders the primary navigation from the
 * `nav_item` table (location `header`); until the backoffice (S12) seeds nav, it
 * falls back to a localized default menu (i18n `settings.nav.*`) so the chrome is
 * usable today. Brand wordmark + Book / List CTAs round out the bar. Sticky, frosted,
 * with a hairline base — design-system.md (premium chrome). Mobile uses a drawer.
 */

/** Default menu (key → route) used when no `nav_item` rows exist yet. */
const DEFAULT_HEADER: Array<{ key: string; href: string }> = [
  { key: "owners", href: "/owners" },
  { key: "buildings", href: "/buildings" },
  { key: "realEstate", href: "/real-estate" },
  { key: "guests", href: "/guests" },
  { key: "about", href: "/about" },
  { key: "blog", href: "/blog" },
];

const BOOK_HREF = "/buildings";
const LIST_HREF = "/owners";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations("settings");
  const items = await getNav(locale, "header");

  const links: NavEntry[] = items.length
    ? items.map((i) => ({ label: i.label, href: i.url }))
    : DEFAULT_HEADER.map((d) => ({ label: t(`nav.${d.key}`), href: d.href }));

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
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={BOOK_HREF}
            className="inline-flex items-center justify-center rounded-md border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            {t("ctaBook")}
          </Link>
          <Link
            href={LIST_HREF}
            className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
          >
            {t("ctaList")} →
          </Link>
        </div>

        <MobileNav
          links={links}
          bookHref={BOOK_HREF}
          bookLabel={t("ctaBook")}
          listHref={LIST_HREF}
          listLabel={t("ctaList")}
          openLabel={t("menu")}
          closeLabel={t("close")}
        />
      </Container>
    </header>
  );
}
