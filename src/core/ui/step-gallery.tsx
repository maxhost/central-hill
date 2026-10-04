import type { ReactNode } from "react";
import { cn } from "./cn";
import { Container } from "./container";
import { Section } from "./section";

export type StepGalleryItem = {
  /** Caller's `<MediaImage>`/`<img>` — fallback already resolved, with its own
   * `absolute inset-0 h-full w-full object-cover` (plus the hover-zoom transition, since this
   * component applies `group` but not the per-image transform — see the docstring below). */
  image: ReactNode;
  title: string;
  description: string;
};

// Mirrors `two-column-showcase.tsx`'s `ALT_BG` (same `.alt` warm off-paper tint) — duplicated
// as a literal rather than imported across files, same reasoning as that one.
const ALT_BG = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

/**
 * A numbered step gallery: a centered heading above a hairline-separated grid of full-bleed
 * photo cards, each with a dark bottom scrim and an overlaid "01" index + title + description
 * in white. First built for Owners' "Your growth path" (`#journey`), ported 1:1 from its old
 * `.mk`-scoped CSS (`.steps`/`.step`/`.step-img`/`.step-scrim`/`.snum` in `owners-page.tsx`'s
 * `OWNERS_STYLE`, now deleted) — no new design.
 *
 * The index ("01".."0N") is derived from array position, not a caller-supplied field — it's a
 * rendering concern tied to order, same as `PricingCards`' "Most Popular" ribbon isn't a prop.
 *
 * Desktop grid is a literal `grid-cols-5` (the original CSS's `repeat(5,1fr)`, and the owners
 * schema fixes `journey.steps` at exactly 5) — this component assumes 5 items at the `981px`+
 * breakpoint; the `681–980px`/`<681px` breakpoints (2-col/1-col) degrade for any item count.
 *
 * Purely presentational, per the `core/ui` ground rule: no `@core/media`, no slice icon
 * registry, no i18n, no `Reveal` wired in (the caller wraps the whole section, same as
 * `StatBand`/`TwoColumnShowcase`/`PricingCards` — this component has no `position:sticky`
 * content, so there's no reason to animate it internally like `EditorialSplit` does).
 */
export function StepGallery({
  headline,
  body,
  items,
  tone = "default",
  className,
}: {
  headline: string;
  body?: string;
  items: StepGalleryItem[];
  /** `"alt"` = the warm `altBg` band the original `#journey` section used (`class="alt"`). */
  tone?: "default" | "alt";
  className?: string;
}) {
  return (
    <Section className={cn(tone === "alt" ? ALT_BG : undefined, className)}>
      <Container>
        <div className="mx-auto mb-[54px] max-w-[45rem] text-center">
          <h2 className="font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
            {headline}
          </h2>
          {body ? (
            <p className="mx-auto mt-4 max-w-[62ch] text-lg text-ink-soft">{body}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-[2px] border border-line bg-line min-[681px]:grid-cols-2 min-[981px]:grid-cols-5">
          {items.map((item, i) => (
            <div key={i} className="group relative flex min-h-[360px] overflow-hidden px-[22px] py-[26px]">
              {item.image}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,18,14,0)_38%,rgba(23,18,14,0.9)_100%)]" />
              <div className="relative z-[2] mt-auto">
                <div className="mb-3 font-serif text-[36px] leading-none text-white/92">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-[7px] text-[18.5px] text-white">{item.title}</h3>
                <p className="text-[13.5px] leading-[1.5] text-white/82">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
