# Component spec — `Carousel`

> Part of [`00-overview.md`](./00-overview.md) — read that first for the ADR requirement and the
> presentational/composer ground rule. **Order: 2nd** — do this right after the motion
> primitives. Clearest, already-proven duplication in the codebase; good second step.

## Current state

Two independent, near-identical client components, both already fully presentational (no data
fetching — they receive pre-rendered `slides: ReactNode[]` from their server-side caller and only
handle scroll/arrows):

- **`portfolio-carousel.tsx`** (`src/slices/pages/ui/components/portfolio-carousel.tsx`, 109
  lines), exported `PortfolioCarousel`. 3-up desktop / 2-up tablet / 1-up mobile. `gap-7` track,
  circular bordered prev/next buttons centered **below** the track.
- **`services-carousel-track.tsx`** (`src/slices/pages/ui/components/services-carousel-track.tsx`,
  147 lines), exported `ServicesCarouselTrack`. 4-up desktop / 3-up tablet / 2-up small tablet /
  1-and-a-peek mobile. `gap-5` track, prev/next buttons floated **over the track edges**
  (`absolute left-3`/`right-3`), with `role="region"`/`aria-label`.

Both implement the exact same mechanism: a `trackRef` + `atStart`/`atEnd` state updated on
scroll/resize (`updateEdges`), `scrollByPage(dir)` that steps by one card's width + gap, honors
`prefers-reduced-motion` (instant scroll vs `smooth`), native swipe fallback when JS is off,
scroll-snap (`snap-x snap-mandatory`, `snap-start` per item). The only real differences: basis
fractions per breakpoint, gap size, button placement/style, and whether a `region` wrapper +
`regionLabel` exists.

**Used by:**
- `FeaturedPortfolio` (`featured-portfolio.tsx`) → `PortfolioCarousel`, 3-up, property cards.
- `ServicesCarousel` (`services-carousel.tsx`) → `ServicesCarouselTrack`, 4-up, service cards.

Both callers are data composers (fetch via `buildings`/`services` contracts) that build their own
server-rendered cards and pass them in as `slides` — that half is untouched by this spec, see
`06-property-card.md` for the card itself.

## Target

One `src/core/ui/carousel.tsx`, `"use client"`, exported `Carousel`:
```ts
{
  slides: ReactNode[];
  prevLabel: string;
  nextLabel: string;
  regionLabel?: string;               // when set, wraps in role="region" aria-label (services' behavior)
  gap?: "sm" | "lg";                  // sm = services' gap-5, lg = portfolio's gap-7
  basis?: {                           // per-breakpoint slide width; covers both current layouts
    base: string;                     // e.g. "78%" (services) or "100%" (portfolio)
    sm?: string;
    md?: string;
    lg?: string;
  };
  buttonPlacement?: "below" | "overlay"; // below = portfolio's centered row, overlay = services' floating edges
}
```
Internals (ref/state/scroll logic) are copied verbatim from either source file — they're
identical — with the breakpoint/gap/button values driven by the new props instead of hardcoded.

## Migration steps

1. Create `src/core/ui/carousel.tsx` with the merged implementation above. Default
   `buttonPlacement` and `gap` to whichever makes the diff smaller against one of the two sources
   (pick one as the "base" implementation, parameterize the deltas).
2. Export `Carousel` from `src/core/ui/index.ts`.
3. Update `featured-portfolio.tsx`: replace `<PortfolioCarousel slides={...} prevLabel={...}
   nextLabel={...} />` with `<Carousel slides={...} prevLabel={...} nextLabel={...} gap="lg"
   basis={{ base: "100%", sm: "calc((100%-1.75rem)/2)", lg: "calc((100%-3.5rem)/3)" }}
   buttonPlacement="below" />`.
4. Update `services-carousel.tsx`: replace `<ServicesCarouselTrack slides={...} .../>` with
   `<Carousel slides={...} prevLabel={...} nextLabel={...} regionLabel={...} gap="sm"
   basis={{ base: "78%", sm: "calc((100%-1.25rem)/2)", md: "calc((100%-2.5rem)/3)", lg:
   "calc((100%-3.75rem)/4)" }} buttonPlacement="overlay" />`.
5. Verify both pages render identically (visual diff at desktop/tablet/mobile widths), then delete
   `portfolio-carousel.tsx` and `services-carousel-track.tsx`.

## Bug found in the real browser, fixed — missing whitespace in `calc()`

The `basis` values both call sites pass (`"calc((100%-1.75rem)/2)"` etc.) were missing the
whitespace CSS requires around a binary `-`/`+` operator inside `calc()` (`calc(100% - 10px)` is
valid, `calc(100%-10px)` is not — without it the parser can't tell the `-` apart from a
negative-number token). Tailwind's own literal `basis-[calc(...)]` arbitrary-value classes (the
*original* `PortfolioCarousel`/`ServicesCarouselTrack` components, and `mobile-drawer.tsx`'s
unrelated `max-h-[calc(100vh-4rem)]`, left untouched) get away with this because the malformed
string is baked into the compiled stylesheet directly. This component's `var(--carousel-basis-*)`
indirection resolves the value through a CSS custom property at `var()`-substitution time instead,
and that path does **not** forgive the missing whitespace — confirmed in Safari via
`ScrollDebugProbe`/`Reveal` console logs (`01-motion-primitives.md`): `document.documentElement.
scrollHeight` ballooned to 25,000,000+ px while scrolling past the carousels on desktop widths
only, which made the page feel like it could never reach its own bottom (mobile was unaffected —
narrower breakpoints never evaluate the broken `lg`/`md` values). Fixed by adding the required
spaces (`"calc((100% - 1.75rem) / 2)"` etc.) in both `featured-portfolio.tsx` and
`services-carousel.tsx`. **Takeaway for any future `Carousel` caller:** always include the
whitespace in `basis` values passed to this component — the CSS-custom-property path is less
forgiving than a literal Tailwind arbitrary-value class would be.

## Verification (component-specific, on top of the shared DoD in 00-overview §6)

- [ ] Featured portfolio: 3-up desktop / 2-up tablet / 1-up mobile, buttons below the track,
      identical to today.
- [ ] Services carousel: 4-up desktop / 3-up / 2-up / peek-mobile, buttons floating over the track
      edges, `role="region"` present, identical to today.
- [ ] Both: `prefers-reduced-motion: reduce` → instant scroll, no smooth animation.
- [ ] Both: keyboard-reachable prev/next buttons, disabled state at start/end of scroll.
- [ ] `portfolio-carousel.tsx` and `services-carousel-track.tsx` no longer exist in the repo.
