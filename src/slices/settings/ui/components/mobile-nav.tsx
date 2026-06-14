"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@core/ui";

export interface NavEntry {
  label: string;
  href: string;
}

/**
 * Mobile navigation drawer (hidden on `lg+`, where the header shows the full bar).
 * Receives already-resolved, serializable nav entries + CTA labels from the server
 * `SiteHeader` so the heavy data work stays server-side.
 */
export function MobileNav({
  links,
  bookHref,
  bookLabel,
  listHref,
  listLabel,
  openLabel,
  closeLabel,
}: {
  links: NavEntry[];
  bookHref: string;
  bookLabel: string;
  listHref: string;
  listLabel: string;
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
        <div className="fixed inset-x-0 top-16 z-40 border-b border-line bg-bg shadow-sm">
          <nav className="flex flex-col px-6 py-4">
            {links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-line/60 py-3 text-base text-ink transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href={bookHref}
                onClick={() => setOpen(false)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md border border-line px-7 py-3",
                  "text-sm font-medium text-ink transition-colors hover:border-ink",
                )}
              >
                {bookLabel}
              </Link>
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
