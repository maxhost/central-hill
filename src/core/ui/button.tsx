import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "solid" | "outline" | "light" | "ghost";
export type ButtonSize = "md" | "sm";

/*
 * The site's ONE button (ADR 0035), the approved mock's `.btn` (`mock/assets/site.css`):
 * 3px radius, 14px/500/.01em label, a 1px border on every variant (transparent on the
 * filled ones, so all variants share one height), .25s ease. The line-height is pinned to the
 * mock body's 1.6 so the height never depends on the surrounding text. `cn` doesn't merge
 * conflicting utilities, so the size lives in `sizes` and each variant sets its own border
 * colour — callers pass layout-only classes (width, margin, self-alignment).
 */
const base =
  "inline-flex cursor-pointer items-center justify-center gap-[0.5em] rounded-[3px] border text-[14px] leading-[1.6] font-medium tracking-[0.01em] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60";

const sizes: Record<ButtonSize, string> = {
  // `.btn` — 14px × 28px (~52px tall).
  md: "px-7 py-[14px]",
  // `.nav-cta .btn` — the compact header/drawer CTA, 11px × 20px (~46px tall).
  sm: "px-5 py-[11px]",
};

const variants: Record<ButtonVariant, string> = {
  // `.btn-accent` — the one primary per section.
  primary: "border-transparent bg-accent text-white hover:bg-accent-deep disabled:hover:bg-accent",
  // `.btn-solid` — ink fill (e.g. the guest panel of `SplitCtaPanels`).
  solid: "border-transparent bg-ink text-bg hover:bg-feature",
  // Hairline secondary on light backgrounds.
  outline: "border-line text-ink hover:border-ink",
  // `.btn-light` — for CTAs over dark media/bands (hero, feature bands): white hairline that
  // inverts to solid on hover. Focus ring stays the accent (set in `base`).
  light: "border-white/65 text-white hover:bg-white hover:text-ink",
  // `.btn-ghost` — an ink border that fills solid ink on hover.
  ghost: "border-ink text-ink hover:bg-ink hover:text-bg",
};

/**
 * The classes of a button variant, for any element that must look like `ButtonLink` — a
 * native `<button>`, a plain `<a>` (external/hash links) or a client island. Same `base` +
 * size + variant strings everywhere, so no button on the site drifts. `className` is for
 * layout only (width, margin, alignment).
 */
export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
  size: ButtonSize = "md",
): string {
  return cn(base, sizes[size], variants[variant], className);
}

/**
 * Primary action as a link (design-system.md → Components: one clear primary per
 * page, accent fill, specific copy). For interactive form submits use a native
 * `<button>` in the owning client component.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  // Absolute http(s) targets are external (e.g. the Avantio/CentralHill booking engine) — open
  // them in a new tab so the catalog stays put. Internal (relative) links navigate in place.
  const external = /^https?:\/\//i.test(href);
  return (
    <Link
      href={href}
      className={buttonClassName(variant, className, size)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
    >
      {children}
    </Link>
  );
}
