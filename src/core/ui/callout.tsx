import type { ReactNode } from "react";
import { cn } from "./cn";

export type CalloutVariant = "tip" | "info" | "warning" | "note";

const BORDER: Record<CalloutVariant, string> = {
  tip: "border-accent",
  info: "border-accent",
  warning: "border-accent-deep",
  note: "border-line",
};

/**
 * Inline aside inside a content column: a tinted panel (30% `line` over `bg`) with a 2px left
 * rule, an optional icon, an optional uppercase label and the body. One component for the blog
 * `callout` block and the guide "Local tip". Ported from `mock/blog-post.html` /
 * `mock/guide-detail.html` (`.callout`, `.callout.warning`, `.callout.note`): the rule is
 * `accent` (tip, info), `accent-deep` (warning) or `line` (note).
 *
 * Presentational, no i18n: `label` and the body arrive translated; `icon` is a caller node (an
 * Iconoir `<Icon>` or `<UiIcon>`), sized 20px in `accent-deep`. Spacing around it is the
 * caller's.
 */
export function Callout({
  variant = "tip",
  icon,
  label,
  children,
  className,
}: {
  variant?: CalloutVariant;
  icon?: ReactNode;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3.5 rounded-r-[6px] border-l-2 bg-[color-mix(in_srgb,var(--color-line)_30%,var(--color-bg))] px-[22px] py-5",
        BORDER[variant],
        className,
      )}
    >
      {icon ? (
        <span className="mt-0.5 flex-none text-accent-deep [&_svg]:block [&_svg]:size-5">{icon}</span>
      ) : null}
      <div>
        {label ? (
          <b className="mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent-deep">
            {label}
          </b>
        ) : null}
        <div className="text-[15.5px] leading-[1.6] text-ink">{children}</div>
      </div>
    </div>
  );
}
