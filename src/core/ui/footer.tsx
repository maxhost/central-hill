import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Container } from "./container";

export interface FooterNavGroup {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterSocialLink {
  key: string;
  url: string;
  /** Short visible glyph, e.g. "ig"/"f" — caller decides which platforms to show. */
  label: string;
}

export interface FooterContact {
  /** Translated prefix before the phone link, e.g. "Call ". */
  callLabel: string;
  phone: string;
  email: string;
  /** Omit together with `whatsapp` to hide that line entirely. */
  whatsappLabel?: string;
  whatsapp?: string;
}

/**
 * Site-wide footer chrome (ADR 0033) — ported verbatim from `slices/settings/ui/site-footer.tsx`.
 * Every data-dependent piece (the settings singleton, `nav_item` footer columns, i18n strings)
 * stays in the composer, which builds `contact`/`social`/`groups`/`copyrightLabel` and passes
 * them in; `newsletter`/`localeSwitcher` are caller-built slots (same reasoning as `NavBar`'s
 * `utilities` — keeps `FooterNewsletter`/`LocaleSwitcher`, both settings-slice components, out of
 * `core/ui`).
 *
 * Uses the app's locale-aware `Link` (`@/i18n/navigation`) for the owner/guest toggle and every
 * group link — the same convention `NavBar` already established, for the same locale-neutral
 * path shape (`/owners`, `/buildings`, …) the composer's `nav_item` rows and defaults use.
 */
export function Footer({
  brand,
  toggleLabel,
  ownerLabel,
  guestLabel,
  newsletter,
  contact,
  social,
  groups,
  copyrightLabel,
  localeSwitcher,
}: {
  /** Caller's own brand mark (plain markup — unlike `NavBar`'s `brand`, this one isn't a link). */
  brand: ReactNode;
  toggleLabel: string;
  ownerLabel: string;
  guestLabel: string;
  /** Caller's own `<FooterNewsletter>` (or nothing, if the section should be omitted). */
  newsletter?: ReactNode;
  contact: FooterContact;
  social: FooterSocialLink[];
  groups: FooterNavGroup[];
  /** Pre-resolved "© {year} Central Hill. All rights reserved." */
  copyrightLabel: string;
  /** Caller's own `<LocaleSwitcher>`. */
  localeSwitcher?: ReactNode;
}) {
  return (
    <footer className="bg-feature text-on-feature">
      <Container className="pb-9 pt-[74px]">
        <div className="mb-[38px] flex flex-col gap-5 border-b border-white/[0.12] pb-[26px] sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[13px] tracking-[0.02em] text-on-feature-soft">
            {toggleLabel}{" "}
            <Link
              href="/owners"
              className="border-b border-white/40 pb-px text-on-feature transition-colors hover:border-white"
            >
              {ownerLabel}
            </Link>{" "}
            ·{" "}
            <Link
              href="/guests"
              className="border-b border-white/40 pb-px text-on-feature transition-colors hover:border-white"
            >
              {guestLabel}
            </Link>
          </div>

          {newsletter}
        </div>

        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            {brand}
            <div className="mt-[18px] text-sm leading-[1.9] text-on-feature-soft">
              <div>
                {contact.callLabel}{" "}
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                  className="hover:text-on-feature"
                >
                  {contact.phone}
                </a>
              </div>
              <div>
                <a href={`mailto:${contact.email}`} className="hover:text-on-feature">
                  {contact.email}
                </a>
              </div>
              {contact.whatsapp ? (
                <div>
                  {contact.whatsappLabel} {contact.whatsapp}
                </div>
              ) : null}
            </div>
            {social.length ? (
              <div className="mt-5 flex gap-[14px]">
                {social.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    aria-label={s.key}
                    className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/20 text-[13px] text-on-feature transition-colors hover:border-white"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {groups.map((grp) => (
            <div key={grp.title}>
              <h4 className="mb-[18px] text-xs font-semibold uppercase tracking-[0.16em] text-on-feature-soft opacity-80">
                {grp.title}
              </h4>
              <ul className="space-y-[11px] text-sm">
                {grp.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-on-feature-soft transition-colors hover:text-on-feature"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-[52px] flex flex-col gap-3 border-t border-white/[0.12] pt-6 text-xs text-on-feature-soft opacity-80 sm:flex-row sm:items-center sm:justify-between">
          <span>{copyrightLabel}</span>
          {localeSwitcher}
        </div>
      </Container>
    </footer>
  );
}
