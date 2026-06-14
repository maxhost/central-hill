import type { ReactNode } from "react";
import { cn } from "./cn";

/** Centered content column, ~1200–1280px max (design-system.md → Layout). */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6 md:px-10", className)}>{children}</div>;
}
