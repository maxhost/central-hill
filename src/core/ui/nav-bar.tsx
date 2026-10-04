import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Container } from "./container";

export interface NavLinkEntry {
  label: string;
  href: string;
  /** One level of sub-tabs, revealed on hover/focus of this top-level item. */
  children?: { label: string; href: string }[];
}

/**
 * Site-wide header chrome (ADR 0033) — the sticky bar + hover-dropdown mechanics only, ported
 * verbatim from `slices/settings/ui/site-header.tsx`. Every data-dependent piece — the DB/
 * default nav merge, the hardcoded Owners/Real Estate/About sub-tab overrides, the
 * `OWNERS_NAV_CSS` scroll-pin style, i18n strings, and the CTAs' actual hrefs — stays in the
 * composer (`site-header.tsx`), which builds `links`/`ctas`/`utilities`/`mobileDrawer` and
 * passes them in; `home-page.tsx`-style slices never call this directly either — only
 * `site-header.tsx` does, once, from `app/[locale]/layout.tsx`. See
 * `docs/specs/home-component-library/08-nav-chrome.md`.
 *
 * The `[data-site-header]` / `.scrolled` / `[data-hero]` / `[data-subnav]` / `[data-nav-item]` /
 * `[data-chrome-keep]` / `[data-subnav-panel]` attributes below are a CSS contract
 * (`app/globals.css` chrome rules, the composer's `OWNERS_NAV_CSS`, and the sibling
 * `HeaderScroll` client island, all left in the composer) — they're load-bearing, not
 * cosmetic, and must not be renamed or dropped.
 *
 * Uses the app's locale-aware `Link` (`@/i18n/navigation`), not a bare `next/link`: `links`
 * carries the same locale-neutral paths (`/owners`, `/owners#worth`, …) the DB `nav_item` rows
 * and `site-footer.tsx` already use, and must resolve through the same auto-prefixing helper —
 * swapping in manually locale-prefixed strings here would diverge from that shared convention
 * for no behavioral gain.
 */
export function NavBar({
  brand,
  links,
  ctas,
  utilities,
  mobileDrawer,
  skipLinkLabel,
  skipLinkHref = "#main",
}: {
  /** Caller's own logo/wordmark element (its own `Link`, `aria-label`, `data-brand`, …). */
  brand: ReactNode;
  links: NavLinkEntry[];
  /** Caller's own persistent CTA buttons (e.g. "Book Now" + "Earn With Us"). */
  ctas?: ReactNode;
  /** Caller's own utilities cluster (owner login, contact trigger, locale switcher, …). */
  utilities?: ReactNode;
  /** Caller's own `<MobileDrawer .../>` (or an equivalent), rendered as-is. */
  mobileDrawer: ReactNode;
  skipLinkLabel: string;
  skipLinkHref?: string;
}) {
  return (
    <header
      data-site-header
      className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/85 backdrop-blur transition-colors duration-300"
    >
      <a
        href={skipLinkHref}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
      >
        {skipLinkLabel}
      </a>
      <Container className="flex h-16 items-center justify-between gap-6">
        {brand}

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

          {ctas ? <div className="ml-2 flex items-center gap-3">{ctas}</div> : null}
        </nav>

        {utilities ? <div className="hidden items-center gap-3 lg:flex">{utilities}</div> : null}

        {mobileDrawer}
      </Container>
    </header>
  );
}
