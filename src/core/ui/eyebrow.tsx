import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Uppercase tracked label — the single highest-leverage "editorial luxury" tell
 * (design-system.md → Typography). Accent color optional.
 */
export function Eyebrow({
  children,
  className,
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-xs font-medium uppercase tracking-[0.16em]",
        accent ? "text-accent" : "text-ink-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
