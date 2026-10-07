"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { UiIcon, cn } from "@core/ui";

/**
 * Language dropdown (header / footer). A compact trigger — globe icon + the *current*
 * locale code + a chevron — opens a menu of the four locales, each relinking the current
 * route in that language (next-intl `usePathname` returns the path without the locale
 * prefix; the locale-aware `Link` re-adds it). Path-prefixed locales per CLAUDE.md → i18n.
 * Closes on outside-click / Escape. `tone="bg"` adapts the trigger to the dark footer and
 * opens the menu upward.
 */

/** Native language name shown in the menu, by locale. */
const NAMES: Record<string, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
};

export function LocaleSwitcher({
  current,
  label,
  tone = "ink",
  icon,
}: {
  current: string;
  label: string;
  /** `ink` for the light header, `bg` for the dark footer. */
  tone?: "ink" | "bg";
  /** Trigger glyph (e.g. a server-rendered `<Icon>`); defaults to Iconoir `language`. */
  icon?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trigger =
    tone === "bg"
      ? "text-on-feature-soft hover:text-on-feature"
      : "text-ink-soft hover:text-ink";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn("inline-flex h-9 items-center gap-1.5 transition-colors", trigger)}
      >
        {icon ?? <UiIcon name="language" size={18} />}
        <span className="text-xs font-medium uppercase tracking-[0.1em]">{current.toUpperCase()}</span>
        <UiIcon name="nav-arrow-down" size={12} strokeWidth={2} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          data-chrome-keep
          role="menu"
          className={cn(
            "absolute right-0 z-50 min-w-40 rounded-xl border border-line bg-bg p-1.5 shadow-lg",
            tone === "bg" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <ul className="flex flex-col">
            {routing.locales.map((locale) => (
              <li key={locale}>
                <Link
                  href={pathname}
                  locale={locale}
                  role="menuitem"
                  aria-current={locale === current ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-6 rounded-md px-3 py-2 text-sm transition-colors",
                    // Selected + hover share the hero "Book Now" accent (--color-accent).
                    locale === current
                      ? "bg-accent text-surface"
                      : "text-ink-soft hover:bg-accent hover:text-surface",
                  )}
                >
                  <span>{NAMES[locale]}</span>
                  <span className="text-xs uppercase tracking-[0.1em] opacity-70">{locale}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
