"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { UiIcon, cn } from "@core/ui";
import { ICON_NAMES, ICON_SPRITE_URL, isIconName } from "@core/ui/icons/names";
import { controlClass } from "./form";

/**
 * Backoffice icon picker (ADR 0034, amendment 2). Previews come from the generated sprite
 * (`<use href="/icons/iconoir-<v>.svg#name">`): one cached static file, loaded only by the
 * admin. The server-only map never reaches the client. The value is an Iconoir name: the same
 * string the strict `iconKey` validates and `<Icon>` renders on the public site.
 */

/** One sprite icon (admin only; public pages render `<Icon>`). */
export function SpriteIcon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} className={className} aria-hidden focusable="false">
      <use href={`${ICON_SPRITE_URL}#${name}`} />
    </svg>
  );
}

export function IconField({
  value,
  onChange,
  allowEmpty = false,
  emptyLabel,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Offer a "no icon" choice (stores `""`). */
  allowEmpty?: boolean;
  /** What an empty value means (e.g. "Default: check"); defaults to "No icon". */
  emptyLabel?: string;
  id?: string;
}) {
  const t = useTranslations("backoffice.icon");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/[\s-]+/).filter(Boolean);
    if (terms.length === 0) return ICON_NAMES;
    return ICON_NAMES.filter((n) => terms.every((term) => n.includes(term)));
  }, [query]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const known = value !== "" && isIconName(value);
  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <div>
      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(controlClass, "flex items-center gap-2.5 text-left")}
      >
        <span className="flex size-6 shrink-0 items-center justify-center text-accent-deep">
          {known ? <SpriteIcon name={value} size={22} /> : null}
        </span>
        <span className={cn("min-w-0 flex-1 truncate", !value && "text-ink-soft")}>
          {value || (emptyLabel ?? t("none"))}
        </span>
        {value && !known ? <span className="text-xs font-medium text-red-600">{t("unknown")}</span> : null}
        <UiIcon name="nav-arrow-down" size={16} className={cn("shrink-0 text-ink-soft transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          id={panelId}
          className="mt-2 rounded-md border border-line bg-bg p-3 shadow-sm"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className={controlClass}
            />
            {allowEmpty && value ? (
              <button
                type="button"
                onClick={() => pick("")}
                className="shrink-0 rounded-md border border-line px-3 py-2 text-sm text-ink hover:border-ink"
              >
                {t("clear")}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-ink-soft">{t("count", { count: matches.length })}</p>
          {matches.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">{t("noResults")}</p>
          ) : (
            <ul className="mt-2 grid max-h-72 grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1 overflow-y-auto">
              {matches.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    title={name}
                    aria-pressed={name === value}
                    onClick={() => pick(name)}
                    className={cn(
                      "flex w-full flex-col items-center gap-1.5 rounded-md border px-1 py-2.5 text-ink transition-colors hover:border-ink",
                      name === value ? "border-accent bg-accent/10 text-accent-deep" : "border-transparent",
                    )}
                  >
                    <SpriteIcon name={name} size={24} />
                    <span className="w-full truncate text-center text-[11px] leading-tight text-ink-soft">{name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
