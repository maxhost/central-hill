import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Sticky side-card shell for a detail page's aside column (booking card, guide "at a glance",
 * post table of contents…): a raised `surface` card with a hairline border, 8px radius and 30px
 * padding, `position: sticky` at `top: 96px` above 980px and back in the flow (static) at
 * ≤980px, where the aside stacks under the content column. Ported from
 * `mock/service-detail.html`'s `.book` shell; the mock's `top:108px` is its 76px nav + 32px, so
 * this uses the live 64px nav (`NavBar`'s `h-16`) + the same 32px.
 *
 * Shell only: what goes inside is the caller's (the service booking card lives in the services
 * slice). Sticky needs the parent grid to use `align-items: start` (otherwise the aside is
 * stretched to the row height and has nowhere to stick). Presentational, no i18n; must render
 * outside `.mk`.
 */
export function StickyAside({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** Optional accessible name for the `<aside>` landmark. */
  label?: string;
}) {
  return (
    <aside
      aria-label={label}
      className={cn(
        "rounded-[8px] border border-line bg-surface p-[30px] leading-[1.6] text-ink min-[981px]:sticky min-[981px]:top-[96px]",
        className,
      )}
    >
      {children}
    </aside>
  );
}
