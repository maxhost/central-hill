"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "./cn";
import { UiIcon } from "./ui-icon";

export type TocItem = {
  /** Id of the target element on the page (the link is `#id`). */
  id: string;
  label: string;
  /** Optional index shown before the label in the serif accent (e.g. "01"). */
  number?: string;
  /** A second-level entry (an `<h3>` under an `<h2>`): indented and a size smaller. */
  sub?: boolean;
};

/**
 * In-page table of contents for a detail page ("In this article", "In this guide"): an uppercase
 * header with an optional icon, then an ordered list of `#id` links on a hairline rail. The entry
 * being read (the last target whose top is above 30% of the viewport) turns `ink`, semibold, with
 * an accent bar on the rail. Ported from `mock/blog-post.html` / `mock/guide-detail.html`
 * (`.toc-h`, `.toc`, `.toc-m`).
 *
 * Two placements, one instance each:
 * - default: the plain list, meant for the top of a `StickyAside`. Hide it at ≤980px with
 *   `className="max-[980px]:hidden"` when the collapsible one is also rendered.
 * - `collapsible`: a closed `<details>` card (surface, hairline, 8px radius, chevron) for the top
 *   of the content column on mobile; it hides itself above 980px.
 *
 * Presentational, no i18n: `title` arrives translated; `icon` is a server-rendered node (an
 * Iconoir `<Icon>`), sized 16px here. The targets need a `scroll-margin-top` for the fixed nav.
 */
export function TocList({
  title,
  items,
  icon,
  collapsible = false,
  className,
}: {
  title: string;
  items: readonly TocItem[];
  icon?: ReactNode;
  collapsible?: boolean;
  className?: string;
}) {
  const active = useActiveId(items);

  const head = (
    <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft [&_svg]:block [&_svg]:size-4 [&_svg]:text-accent-deep">
      {icon}
      {title}
    </span>
  );

  const list = (
    <ol className={cn("list-none border-l border-line", collapsible ? "mx-5 mb-[18px]" : "mt-4")}>
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={item.id === active ? "location" : undefined}
            className={cn(
              "-ml-px flex gap-2.5 border-l-2 py-2 leading-[1.45] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-ink",
              item.sub ? "pl-8 text-[13.5px]" : "pl-[18px] text-[14.5px]",
              item.id === active ? "border-accent font-semibold text-ink" : "border-transparent text-ink-soft",
            )}
          >
            {item.number ? (
              <span className="min-w-5 font-serif text-accent-deep">{item.number}</span>
            ) : null}
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );

  if (collapsible) {
    return (
      <details
        className={cn(
          "group mb-[34px] rounded-[8px] border border-line bg-surface min-[981px]:hidden",
          className,
        )}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
          {head}
          <UiIcon
            name="nav-arrow-down"
            size={18}
            className="block text-ink-soft transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        {list}
      </details>
    );
  }

  return (
    <nav aria-label={title} className={className}>
      {head}
      {list}
    </nav>
  );
}

/** Id of the last target whose top is above 30% of the viewport (null above the first). */
function useActiveId(items: readonly TocItem[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current: string | null = null;
      for (const el of targets) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  return active;
}
