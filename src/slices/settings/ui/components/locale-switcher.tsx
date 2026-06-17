"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@core/ui";

/**
 * Header / footer language switcher — relinks the *current* route in each locale
 * (next-intl `usePathname` returns the path without the locale prefix; the
 * locale-aware `Link` re-adds it). Path-prefixed locales per CLAUDE.md → i18n.
 *
 * Each locale carries a country flag (client feedback B1 — flag/language selector in
 * the top-right corner). Flags are emoji so they need no asset pipeline; the locale
 * code stays visible for clarity and accessibility.
 */

/** Flag emoji per locale (English shown as the UK flag). */
const FLAGS: Record<string, string> = { en: "🇬🇧", pt: "🇵🇹", es: "🇪🇸", fr: "🇫🇷" };

export function LocaleSwitcher({
  current,
  label,
  tone = "ink",
}: {
  current: string;
  label: string;
  /** `ink` for the light header, `bg` for the dark footer. */
  tone?: "ink" | "bg";
}) {
  const pathname = usePathname();
  const idle = tone === "bg" ? "text-bg/70" : "text-ink-soft";
  const active = tone === "bg" ? "text-bg" : "text-ink";
  const hover = tone === "bg" ? "hover:text-bg" : "hover:text-ink";

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-xs uppercase tracking-[0.12em]">
      {routing.locales.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 ? (
            <span aria-hidden className="text-line">
              ·
            </span>
          ) : null}
          <Link
            href={pathname}
            locale={locale}
            aria-current={locale === current ? "true" : undefined}
            className={cn(
              "inline-flex items-center gap-1 transition-colors",
              hover,
              locale === current ? active : idle,
            )}
          >
            <span aria-hidden>{FLAGS[locale]}</span>
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </nav>
  );
}
