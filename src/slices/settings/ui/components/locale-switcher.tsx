"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@core/ui";

/**
 * Footer language switcher — relinks the *current* route in each locale (next-intl
 * `usePathname` returns the path without the locale prefix; the locale-aware `Link`
 * re-adds it). Path-prefixed locales per CLAUDE.md → i18n.
 */
export function LocaleSwitcher({ current, label }: { current: string; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex items-center gap-1 text-xs uppercase tracking-[0.12em]">
      {routing.locales.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 ? <span aria-hidden className="text-line">·</span> : null}
          <Link
            href={pathname}
            locale={locale}
            aria-current={locale === current ? "true" : undefined}
            className={cn(
              "transition-colors hover:text-ink",
              locale === current ? "text-ink" : "text-ink-soft",
            )}
          >
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </nav>
  );
}
