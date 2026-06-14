import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "./cn";

type Variant = "primary" | "outline";

const base =
  "inline-flex items-center justify-center rounded-md px-7 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-surface hover:bg-accent-deep",
  outline: "border border-line text-ink hover:border-ink",
};

/**
 * Primary action as a link (design-system.md → Components: one clear primary per
 * page, accent fill, specific copy). For interactive form submits use a native
 * `<button>` in the owning client component.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
