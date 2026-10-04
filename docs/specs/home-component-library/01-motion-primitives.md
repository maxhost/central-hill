# Component spec — `Reveal` + `CountUp` (motion primitives)

> Part of [`00-overview.md`](./00-overview.md) — read that first for the ADR requirement and the
> presentational/composer ground rule. **Order: 1st** — lowest risk, pure moves, do these before
> anything else to prove the migration mechanics with zero behavior change.

## Current state

Both already fully presentational — no slice imports, no data fetching. This is a **path move
only**, not a rewrite.

- **`Reveal`** — `src/slices/pages/ui/components/reveal.tsx` (65 lines). `"use client"`.
  `IntersectionObserver`-based fade/slide-in wrapper, fires once. `motion-reduce:*` Tailwind
  variants handle `prefers-reduced-motion` (CSS, not JS — avoids a `set-state-in-effect` lint
  issue). Props: `{ children: ReactNode; className?: string }`.
- **`CountUp`** — `src/slices/pages/ui/components/count-up.tsx` (103 lines). `"use client"`.
  Parses a display string (`"€55M+"`, `"60,000+"`) into `[prefix, number, suffix]`, animates the
  integer 0→target on scroll-into-view with `easeOutCubic`, re-applies the original thousands
  separator. Honors `prefers-reduced-motion` and degrades to the static string with no JS/IO.
  Props today: `{ value: string; className?: string }`. `DURATION_MS = 4000` is a fixed module
  constant — not currently a prop.

**Used by:** `stats-band.tsx` (`CountUp`), `home-page.tsx` directly (`Reveal`, wrapping
`StatsBand`/`GuestsSection`/etc. at the call site — see `03-stat-band.md` and
`05-two-column-showcase.md` for why wrapping happens at the call site, not inside the component).

**Not the same component as `OwnerStatsCounter`** (`pages/ui/components/owner-stats-counter.tsx`),
which does the same count-up job for Owners/About — both `.mk` pages, **out of scope** here (see
overview §7). The prior handoff's inventory already flags these as two separate implementations
of one idea (`CountUp` React vs `OwnerStatsCounter` vanilla-JS island, the latter with a
`durationMs` prop: 1600ms default, About uses 5000ms). Don't conflate them — this spec only moves
`CountUp`. Unifying the two is future work for whoever picks up the `.mk`-vs-React question.

## Target

- `src/core/ui/motion/reveal.tsx` — identical code, identical export name `Reveal`, identical
  props. Only the import path changes for every consumer.
- `src/core/ui/motion/count-up.tsx` — identical code, identical export name and props
  (`{ value: string; className?: string }`), identical `DURATION_MS = 4000`.

## Migration steps

1. Create `src/core/ui/motion/reveal.tsx` and `src/core/ui/motion/count-up.tsx` as verbatim copies
   of the current files (no behavior change).
2. Export both from `src/core/ui/index.ts`.
3. Update `src/slices/pages/ui/components/stats-band.tsx` to import `CountUp` from `@core/ui`
   instead of `./count-up`.
4. Update `src/slices/pages/ui/home-page.tsx` to import `Reveal` from `@core/ui` instead of
   `./components/reveal`.
5. Grep the whole repo for any other importer of `./reveal` or `./count-up` — confirm there is
   none besides the two above (`owner-stats-counter.tsx` is a separate file and is not touched).
6. Delete `src/slices/pages/ui/components/reveal.tsx` and `count-up.tsx` once every importer is
   repointed and verified.

## Verification (component-specific, on top of the shared DoD in 00-overview §6)

- [ ] Home's stats band still counts up on scroll with the same 4000ms duration (unchanged).
- [ ] `prefers-reduced-motion: reduce` (toggle in devtools) still shows final values immediately
      for both components, no animation.
- [ ] No remaining import of `@slices/pages/ui/components/reveal` or `count-up` anywhere in the
      repo, and `owner-stats-counter.tsx` is untouched.
