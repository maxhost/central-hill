import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "./cn";

export type DetailTitleCrumb = {
  label: string;
  /** Omit for the current page (rendered as plain text with `aria-current="page"`). */
  href?: string;
};

/**
 * Left-aligned, photo-less title block for a **detail page** (breadcrumb → eyebrow → `<h1>` →
 * tagline → meta line), in its own 1240px/28px column with `34px`/`28px` vertical padding. First
 * built for the service detail page, ported 1:1 from `mock/service-detail.html`'s
 * `.svc-top`/`.crumbs`/`.tagline`/`.meta-line` rules; meant for the other editorial detail pages
 * (blog post, city guide) that sit under the solid nav rather than a photo hero.
 *
 * **Not `Hero`** (a full-bleed image/video band with white overlaid copy) and **not `PageHead`**
 * (a centred listing header): this one is left-aligned, ink-on-paper, carries a breadcrumb and a
 * meta line, and leaves the photos to a gallery below it (e.g. `MosaicGallery adaptive`).
 *
 * - Breadcrumb: 13px `ink-soft`, `/` separators at 55% opacity with 8px side margins, links turn
 *   `accent-deep` + underline on hover; 26px below it.
 * - Eyebrow: 12px / 600 / `.18em` uppercase `accent-deep`, 12px below.
 * - Title: serif `clamp(36px,5vw,60px)`, line-height 1.04, `20ch` max.
 * - Tagline: 18px `ink-soft`, 1.6, `60ch` max, 16px above.
 * - Meta line: each `meta` node in order, separated by 3px round `ink-soft` dots (60%), wrapping
 *   with `10px 22px` gaps, 14px `ink`, 22px above. Omitted when empty. Item styling (icons, bold
 *   rating…) is the caller's.
 *
 * Purely presentational, per the `core/ui` ground rule: no i18n, no `@core/media`; every string
 * arrives pre-translated. MUST render outside any `.mk`-scoped subtree (Lesson 1 in
 * `docs/component-extraction-workflow.md`).
 */
export function DetailTitle({
  crumbs,
  breadcrumbLabel,
  eyebrow,
  title,
  tagline,
  meta,
  className,
}: {
  crumbs: readonly DetailTitleCrumb[];
  /** Accessible name of the breadcrumb `<nav>` (e.g. "Breadcrumb"). */
  breadcrumbLabel: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  tagline?: ReactNode;
  meta?: readonly ReactNode[];
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-[1240px] px-[28px] pt-[34px] pb-[28px] leading-[1.6] text-ink", className)}>
      <nav aria-label={breadcrumbLabel} className="mb-[26px] text-[13px] text-ink-soft">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 ? (
              <span aria-hidden className="mx-2 opacity-55">
                /
              </span>
            ) : null}
            {c.href ? (
              <Link href={c.href} className="hover:text-accent-deep hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </Fragment>
        ))}
      </nav>
      {eyebrow ? (
        <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">{eyebrow}</span>
      ) : null}
      <h1 className="max-w-[20ch] font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.04] tracking-[-0.015em] text-ink">
        {title}
      </h1>
      {tagline ? <p className="mt-4 max-w-[60ch] text-lg leading-[1.6] text-ink-soft">{tagline}</p> : null}
      {meta?.length ? (
        <div className="mt-[22px] flex flex-wrap items-center gap-x-[22px] gap-y-[10px] text-sm text-ink">
          {meta.map((m, i) => (
            <Fragment key={i}>
              {i > 0 ? <span aria-hidden className="size-[3px] rounded-full bg-ink-soft opacity-60" /> : null}
              {m}
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}
