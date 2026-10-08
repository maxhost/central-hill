"use client";

import { useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "./button";
import { UiIcon } from "./ui-icon";

export interface NavCta {
  href: string;
  label: string;
  /** External booking engine link (opens in a new tab). */
  external?: boolean;
}

export interface NavEntry {
  label: string;
  href: string;
  /** One level of sub-tabs (header hover menu / footer column). */
  children?: NavEntry[];
}

/**
 * Mobile navigation drawer shell (ADR 0033) — ported verbatim from
 * `slices/settings/ui/components/mobile-nav.tsx`, minus the direct `ContactDialog` import:
 * the caller (`site-header.tsx`) passes its own contact trigger as `contactSlot` so `core/ui`
 * doesn't depend on a settings-slice component. Hidden on `lg+`, where `NavBar` shows the full
 * bar. Receives already-resolved, serializable nav entries + CTA labels — no data fetching of
 * its own. See `docs/specs/home-component-library/08-nav-chrome.md`.
 */
export function MobileDrawer({
  links,
  loginHref,
  loginLabel,
  contactSlot,
  book,
  earn,
  openLabel,
  closeLabel,
}: {
  links: NavEntry[];
  loginHref: string;
  loginLabel: string;
  /** Caller's own contact trigger (e.g. `<ContactDialog variant="button" .../>`). */
  contactSlot: ReactNode;
  book: NavCta;
  /** Owner-acquisition CTA ("Earn With Us") — standout accent fill, drawer-only. */
  earn: NavCta;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-surface"
      >
        <UiIcon name={open ? "xmark" : "menu"} size={open ? 28 : 20} />
      </button>

      {open ? (
        <div
          data-chrome-keep
          className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-line bg-bg shadow-sm"
        >
          <nav className="flex flex-col px-6 py-4">
            {links.map((l) => (
              <div key={l.href + l.label} className="border-b border-line/60">
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-ink transition-colors hover:text-accent"
                >
                  {l.label}
                </Link>
                {l.children?.length ? (
                  <div className="flex flex-col pb-2 pl-4">
                    {l.children.map((c) => (
                      <Link
                        key={c.href + c.label}
                        href={c.href}
                        onClick={() => setOpen(false)}
                        className="py-2 text-sm text-ink-soft transition-colors hover:text-accent"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            <a
              href={loginHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-line/60 py-3 text-base text-ink transition-colors hover:text-accent"
            >
              {loginLabel}
            </a>

            <div className="mt-4 flex flex-col gap-3">
              <a
                href={book.href}
                target={book.external ? "_blank" : undefined}
                rel={book.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className={buttonClassName("ghost", undefined, "sm")}
              >
                {book.label}
              </a>
              {/* Owner-acquisition CTA, drawer-only (client feedback) — solid accent fill
               * (mirrors `core/ui` `ButtonLink`'s `primary` variant) so it stands out next to
               * the outlined "Book Now" above it. */}
              <a
                href={earn.href}
                target={earn.external ? "_blank" : undefined}
                rel={earn.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className={buttonClassName("primary", undefined, "sm")}
              >
                {earn.label}
              </a>
              {contactSlot}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
