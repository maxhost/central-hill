import type { ReactNode } from "react";
import { cn } from "./cn";
import { Container } from "./container";

export type IconFeatureGridItem = {
  /** Caller-built icon element (e.g. a server parent's `<Icon name="chat-bubble" size={24} />`
   * from `@core/ui/icon`, ADR 0034), rendered inside the component's own 48px bordered
   * circle. Same "caller supplies the node, no slice icon registry here" convention as
   * `EditorialSplit`'s `item.icon`. */
  icon?: ReactNode;
  title: string;
  description: string;
};

/**
 * A bordered, tinted "value strip" band: a centered eyebrow + heading above a fixed
 * 3-column grid of icon-circle/title/description items. First built for Services' "How It
 * Works" (`.howstrip`/`.how-grid`/`.how-item` in `services-listing.tsx`'s old `PAGE_STYLE`,
 * now trimmed to the page's still-raw sections only) — ported 1:1, not a new design.
 *
 * Historical: that file's old docstring claimed the Iconoir glyphs "render blank" on this page;
 * that was stale (the old `mock.css` mask-icon stylesheet did render them). This component
 * renders whatever `icon` node the caller passes (now an inline `<Icon>` SVG, ADR 0034).
 *
 * Not `StepGallery`: that component is always full-bleed **photo** cards with a numbered
 * index overlay, no bordered icon circle, and no centered eyebrow/heading band chrome of its
 * own (its heading sits directly in a plain `Section`). Not `EditorialSplit`: that one is a
 * two-column sticky layout with a hairline *list* of icon/title/description rows, not a
 * plain N-up grid, and has no band background/border. This component's items are a
 * fixed-width grid, each card self-contained (icon + copy side by side), inside its own
 * bordered/tinted band — different enough from both that stretching either would blur what
 * it guarantees its existing consumers.
 *
 * Deliberately bakes in its own band chrome (`border-y`, tinted background, fixed
 * `py-[54px]`) rather than taking `core/ui`'s `Section` — same reasoning as `StatBand`: the
 * band *is* this component's design, not a composition concern left to the caller. The tint
 * is a one-off `color-mix(in_srgb,var(--color-line)_26%,var(--color-bg))` (the mock's
 * `.howstrip` background) — close to, but a different mix ratio than, `StepGallery`/
 * `TwoColumnShowcase`'s shared `ALT_BG` (38%), so it's kept as its own literal rather than
 * reusing that constant.
 *
 * Desktop grid is a literal `grid-cols-3` (the original CSS's `repeat(3,1fr)`) — this
 * component assumes 3 items at its `821px`+ breakpoint (the mock's own `max-width:820px`
 * single-column collapse point), the same "pinned to the source page's item count"
 * assumption `StepGallery` documents for its own 5-column desktop grid.
 *
 * Purely presentational, per the `core/ui` ground rule: no `@core/media`, no slice icon
 * registry, no i18n, no `Reveal` wired in internally — the caller wraps it, same as
 * `StatBand`/`FeaturePanel`/`StepGallery`.
 */
export function IconFeatureGrid({
  eyebrow,
  headline,
  items,
  className,
}: {
  eyebrow?: string;
  headline: string;
  items: IconFeatureGridItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-y border-line bg-[color-mix(in_srgb,var(--color-line)_26%,var(--color-bg))] py-[54px]",
        className,
      )}
    >
      <Container>
        <div className="mx-auto mb-[38px] max-w-[45rem] text-center">
          {eyebrow ? (
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
              {eyebrow}
            </span>
          ) : null}
          <h2
            className={cn(
              "font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink",
              eyebrow ? "mt-[14px]" : undefined,
            )}
          >
            {headline}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-[30px] min-[821px]:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-line bg-surface text-2xl text-accent-deep"
              >
                {item.icon}
              </span>
              <div>
                <h4 className="mt-0.5 mb-1.5 font-serif text-[19px] font-medium text-ink">
                  {item.title}
                </h4>
                <p className="text-sm leading-[1.65] text-ink-soft">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
