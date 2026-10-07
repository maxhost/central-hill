import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Two-column body of a detail page: a fluid content column beside a fixed 380px aside
 * (`minmax(0,1fr) 380px`, gap `clamp(40px,6vw,90px)`), stacking to one column at ≤980px with
 * the aside under the content. Top-aligned (`items-start`) so a `StickyAside` inside the aside
 * column can stick. Includes the standard 1240/28 column and the body's vertical padding
 * (`clamp(48px,6vw,80px)` top, `clamp(72px,8vw,110px)` bottom). Ported from
 * `mock/service-detail.html`'s `.svc-body`; first used by the services detail page, meant for
 * the blog post and guide detail pages too.
 *
 * Presentational, no i18n.
 */
export function DetailLayout({
  main,
  aside,
  className,
}: {
  main: ReactNode;
  aside: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-[clamp(40px,6vw,90px)] px-[28px] pt-[clamp(48px,6vw,80px)] pb-[clamp(72px,8vw,110px)] min-[981px]:grid-cols-[minmax(0,1fr)_380px]",
        className,
      )}
    >
      <div>{main}</div>
      {aside}
    </div>
  );
}
