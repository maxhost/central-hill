# Component spec — `Hero`

> Part of [`00-overview.md`](./00-overview.md) — read that first for the ADR requirement and the
> presentational/composer ground rule. **Order: 3rd** — already pure, path move + rename only.

## Current state

`src/slices/pages/ui/components/hero.tsx` (137 lines), exported as `PageHero`. Already fully
presentational — media is resolved **upstream** in `home-page.tsx`/`owners-page.tsx` into a
`MediaImageData`, and the component just renders it. No slice imports beyond `@core/media`
(`MediaImage`) and `@core/ui` (`Container`, `cn`) — both already kernel, not slice, imports.

Props today:
```ts
{
  image: MediaImageData | null;
  imageUrl?: string | null;   // escape hatch: external hotlink while no R2 asset is set
  videoUrl?: string | null;
  posterUrl?: string | null;
  eyebrow?: string;
  eyebrowPill?: boolean;      // solid accent badge style vs plain uppercase label
  headline: string;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;          // e.g. Owners' earnings-estimate card, two-column layout
  compact?: boolean;          // lower min-height for form-bearing heroes
}
```

Background precedence: `videoUrl` → `image` (R2, optimized) → `imageUrl` (plain external hotlink).
Rule applied everywhere in the codebase: **hero is never animated** (it's the LCP element) — this
spec does not change that.

**Used by:** only `home-page.tsx` (video hero) — confirmed by a repo-wide grep for `PageHero`, no
other importer exists. The `.mk` pages (Owners/About/Real Estate/Guests) reimplement the same
visual pattern as raw HTML-string markup inside their own `PAGE_STYLE`/body builders — they do not
import this component today, and this spec does not change that (out of scope, overview §7).

## Target

`src/core/ui/hero.tsx`, exported as `Hero` (renamed from `PageHero`). **One prop shape change from
the original, found during verification, not optional:** `image`/`imageUrl`/`videoUrl`/`posterUrl`
collapse into a single `background?: ReactNode`, caller-built. Keeping `MediaImageData`/`MediaImage`
imported directly in `core/ui/hero.tsx` (as the original did) breaks at runtime once `Hero` is
exported through the shared `core/ui/index.ts` barrel: any `"use client"` component elsewhere in
the app that imports anything from `@core/ui` (e.g. `settings/ui/components/contact-dialog.tsx`,
which imports `ButtonLink`) pulls in the *entire* barrel's module graph for the browser bundle,
including `@core/media`'s server-only `server/ingest.ts` (the `sharp`-based upload pipeline) —
Turbopack can't chunk `sharp`'s `node:child_process`/`node:module` requires for the browser and
every page 500s. This is exactly the failure mode `05-two-column-showcase.md`/`06-property-card.md`/
`07-dual-cta-panels.md` already designed around (`image`/`panel.image` as `ReactNode`, caller
builds the `<MediaImage>` element) — `Hero`'s original spec text missed applying the same rule to
itself. Caller (`home-page.tsx`) now builds its own `<video>` element and passes it as
`background`; the `image`/`imageUrl` fallback branches it had are dead code today (Home's `hero`
schema is video-only, and `Hero` has no other caller — confirmed by grep) and were dropped rather
than ported, since `ReactNode` makes the caller responsible for its own fallback chain.

## Migration steps

1. Create `src/core/ui/hero.tsx` with the component renamed `PageHero` → `Hero`, otherwise
   verbatim.
2. Export `Hero` from `src/core/ui/index.ts`.
3. Update `home-page.tsx` to `import { Hero } from "@core/ui"` and the JSX tag `<PageHero` → `<Hero`.
4. Delete `src/slices/pages/ui/components/hero.tsx`.
5. Re-run the grep for `PageHero` to confirm zero remaining references before deleting.

## Verification (component-specific, on top of the shared DoD in 00-overview §6)

- [ ] Home's hero renders pixel-identical (video, overlay gradient, headline sizing at `compact`
      and default).
- [ ] Hero still never gets wrapped in `Reveal`/any entrance animation (unchanged rule).
