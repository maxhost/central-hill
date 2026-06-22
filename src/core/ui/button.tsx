import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "./cn";

type Variant = "primary" | "outline" | "light";

const base =
  "inline-flex items-center justify-center rounded-md px-7 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-surface hover:bg-accent-deep",
  outline: "border border-line text-ink hover:border-ink",
  // For CTAs over dark media/bands (hero, dual-CTA owner column): white hairline →
  // inverts to solid on hover. Focus ring stays the accent (set in `base`).
  light: "border border-white/60 text-white hover:bg-white hover:text-ink",
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
  // Absolute http(s) targets are external (e.g. the Avantio/CentralHill booking engine) — open
  // them in a new tab so the catalog stays put. Internal (relative) links navigate in place.
  const external = /^https?:\/\//i.test(href);
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
    >
      {children}
    </Link>
  );
}
