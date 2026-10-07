import type { ReactNode } from "react";
import { cn } from "./cn";

export type IconFactItem = {
  /** Caller's inline `<svg>` (sized 20px, tinted `accent-deep` here). */
  icon: ReactNode;
  title: ReactNode;
  note?: ReactNode;
};

/**
 * Key-facts grid for a detail page: each fact is a 44px round hairline icon disc beside a bold
 * 15px title and an optional 14px `ink-soft` note. Two columns (`26px 34px` gaps), one column
 * ≤560px (mobile-first `min-[561px]:`). Ported 1:1 from `mock/service-detail.html`'s
 * `.facts`/`.fact`/`.ic`; meant for any detail page's "at a glance" row (service, guide, post).
 *
 * **Not `AmenityGrid`** (a hairline-*celled* 4→2→1 grid of icon + single label, no disc, no
 * note), **not `SpecStrip`** (big value over a small label, no icons) and **not
 * `IconFeatureGrid`** (a centred 3-column section with its own band and heading).
 *
 * Bare and presentational (no section shell, no heading — the caller places it, e.g. as the
 * first `ContentBlock`); no i18n; renders nothing for an empty list.
 */
export function IconFactGrid({ items, className }: { items: readonly IconFactItem[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={cn("grid grid-cols-1 gap-x-[34px] gap-y-[26px] min-[561px]:grid-cols-2", className)}>
      {items.map((f, i) => (
        <li key={i} className="flex items-start gap-4">
          <span
            aria-hidden
            className="grid size-11 flex-none place-items-center rounded-full border border-line bg-surface text-accent-deep [&_svg]:size-5"
          >
            {f.icon}
          </span>
          <div className="leading-[1.6]">
            <b className="block text-[15px] font-semibold text-ink">{f.title}</b>
            {f.note ? <span className="text-sm leading-[1.55] text-ink-soft">{f.note}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
