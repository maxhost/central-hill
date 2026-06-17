"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@core/ui";
import { ContactDialog } from "./contact-dialog";

export interface NavEntry {
  label: string;
  href: string;
  /** One level of sub-tabs (header hover menu / footer column). */
  children?: NavEntry[];
}

/**
 * Mobile navigation drawer (hidden on `lg+`, where the header shows the full bar).
 * Receives already-resolved, serializable nav entries + CTA labels from the server
 * `SiteHeader` so the heavy data work stays server-side. The drawer also surfaces the
 * top-right utilities (contact form, owner login) that live inline on desktop, plus
 * each top-level item's sub-tabs as an indented sub-list (client feedback B1).
 */
export function MobileNav({
  links,
  bookHref,
  bookLabel,
  listHref,
  listLabel,
  loginHref,
  loginLabel,
  contactLabel,
  contactTitle,
  contactIntro,
  openLabel,
  closeLabel,
}: {
  links: NavEntry[];
  /** External Avantio booking URL (B2) — rendered as a plain anchor. */
  bookHref: string;
  bookLabel: string;
  listHref: string;
  listLabel: string;
  loginHref: string;
  loginLabel: string;
  contactLabel: string;
  contactTitle: string;
  contactIntro: string;
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
        <span aria-hidden className="text-xl leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-line bg-bg shadow-sm">
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
              <ContactDialog
                variant="button"
                label={contactLabel}
                title={contactTitle}
                intro={contactIntro}
              />
              <a
                href={bookHref}
                className={cn(
                  "inline-flex items-center justify-center rounded-md border border-line px-7 py-3",
                  "text-sm font-medium text-ink transition-colors hover:border-ink",
                )}
              >
                {bookLabel}
              </a>
              <Link
                href={listHref}
                onClick={() => setOpen(false)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md bg-accent px-7 py-3",
                  "text-sm font-medium text-surface transition-colors hover:bg-accent-deep",
                )}
              >
                {listLabel} →
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
