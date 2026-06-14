import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Section with the editorial vertical rhythm `clamp(64px,10vw,160px)`
 * (design-system.md — tight sections are the #1 "cheap" tell).
 */
export function Section({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "header" | "footer";
}) {
  return (
    <Tag className={cn("py-[clamp(64px,10vw,160px)]", className)}>{children}</Tag>
  );
}
