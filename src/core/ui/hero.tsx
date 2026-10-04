import type { ReactNode } from "react";
import { Container } from "./container";
import { cn } from "./cn";

/**
 * Page hero (S9). A full-width media band with an overlaid editorial headline.
 *
 * `background` is caller-built (its own `<video>`, `<MediaImage>`, or `<img>` — whatever
 * precedence/fallback it needs) and rendered absolutely-positioned behind the gradient
 * scrim; this keeps `@core/media` out of `core/ui` (golden rule 3 — the kernel's UI layer
 * stays presentation-only, no slice/media-resolution coupling), the same pattern
 * `TwoColumnShowcase`/`PropertyCard`/`DualCtaPanels` already use for their images.
 *
 * Two layouts: the default single-column editorial hero, or — when `aside` is provided
 * (Owners earnings-estimate card, mirroring `mock/owners.html`) — a two-column band with
 * the copy on the left and the slotted card bottom-aligned on the right. `compact` lowers
 * the minimum height for these form-bearing heroes so the page below stays close.
 *
 * `eyebrowPill` renders the eyebrow as the mock's solid accent badge ("★ …").
 */
export function Hero({
  background,
  eyebrow,
  eyebrowPill,
  headline,
  subtitle,
  actions,
  aside,
  compact,
}: {
  background?: ReactNode;
  eyebrow?: string;
  eyebrowPill?: boolean;
  headline: string;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  compact?: boolean;
}) {
  const copy = (
    <div className="text-surface">
      {eyebrow ? (
        eyebrowPill ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-surface">
            <span aria-hidden>★</span>
            {eyebrow}
          </span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-feature-accent">
            {eyebrow}
          </span>
        )
      ) : null}
      <h1
        className={cn(
          "mt-4 max-w-[15ch] font-serif font-medium leading-[1.05]",
          compact
            ? "text-[clamp(2.4rem,5.4vw,4.25rem)]"
            : "text-[clamp(2.75rem,7vw,5.5rem)]",
        )}
      >
        {headline}
      </h1>
      {subtitle ? (
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-surface/85">{subtitle}</p>
      ) : null}
      {actions ? <div className="mt-8 flex flex-wrap items-center gap-4">{actions}</div> : null}
    </div>
  );

  return (
    <section
      data-hero
      className={cn(
        "relative isolate flex items-end overflow-hidden bg-feature",
        // `compact` keeps the headline smaller for form-bearing heroes (the aside card
        // shares the row) but still fills the viewport like the mock. The hero is
        // bottom-anchored (`items-end`) — this min-height is what sets the empty band above
        // the copy under the fixed navbar, so it's the one value that tunes that gap.
        "min-h-[73.6vh]",
      )}
    >
      {background}

      <div
        className={cn(
          "absolute inset-0 -z-10",
          "bg-gradient-to-t from-black/70 via-black/30 to-black/20",
        )}
        aria-hidden
      />

      <Container className="pb-[clamp(56px,9vh,104px)] pt-32">
        {aside ? (
          <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="max-w-xl">{copy}</div>
            {aside}
          </div>
        ) : (
          <div className="max-w-3xl">{copy}</div>
        )}
      </Container>
    </section>
  );
}
