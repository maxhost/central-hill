import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * One block of a detail page's content column: optional uppercase eyebrow, optional serif
 * `<h2>`, then the caller's body — `40px` vertical padding with a hairline **top** border
 * between blocks; the first block in its parent drops both (`first:`). Ported 1:1 from
 * `mock/service-detail.html`'s `.block` / `.block > .eyebrow` / `.block h2` rules (eyebrow 12px
 * `accent-deep`, 10px below; title `clamp(26px,3vw,34px)`, line-height 1.15, 22px below). Meant
 * for any narrow content column beside an aside (service, guide, post detail).
 *
 * **Not `SectionHead`/`ProseSection`**: those are full-width page sections (the 30–50px title,
 * section padding and band rhythm); this is a compact sub-section stacked inside one column,
 * separated by hairlines instead of bands.
 *
 * Presentational, no i18n — strings arrive pre-translated; `id` lands on the block (in-page
 * anchors, 84px scroll margin for the fixed nav).
 */
export function ContentBlock({
  eyebrow,
  title,
  id,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-[84px] border-t border-line py-10 leading-[1.6] first:border-t-0 first:pt-0",
        className,
      )}
    >
      {eyebrow ? (
        <span className="mb-2.5 block text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">{eyebrow}</span>
      ) : null}
      {title ? (
        <h2 className="mb-[22px] font-serif text-[clamp(26px,3vw,34px)] font-medium leading-[1.15] tracking-[-0.015em] text-ink">
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}
