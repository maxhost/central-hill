# Component spec — `StatBand`

> Part of [`00-overview.md`](./00-overview.md) — read that first for the ADR requirement and the
> presentational/composer ground rule. **Order: 4th.** Needs the presentational/composer split
> (see overview §3) — not a pure move like `Hero`/`Reveal`/`CountUp`.

## Current state

`src/slices/pages/ui/components/stats-band.tsx` (61 lines), exported as `StatsBand`. **Not** pure
presentational — it is `async` and calls `getGlobals(locale)` itself (settings slice contract),
then filters/maps the result before rendering. This is the one thing blocking a straight path
move: a `core/ui` file cannot import `@slices/settings/contract`.

Props today:
```ts
{
  locale: Locale;
  keys: StatKey[];       // which figures to pull from the settings singleton
  showTitle?: boolean;   // hide the centred heading for a bare proof band (Owners)
}
```
Renders `null` if `getGlobals` returns nothing, or if every requested key is empty. Layout: dark
`bg-feature` band, optional centred `h2` title, then a `dl` grid of cells, each using `CountUp`
(see `01-motion-primitives.md`) for the count-up figure.

**Used by:** only `home-page.tsx` (with title) — confirmed by a repo-wide grep, no other importer.
The file's own doc comment calls it the "Home/Owners/About" stats band conceptually, but
Owners/About are `.mk` pages and use the separate `OwnerStatsCounter` mechanism (see
`01-motion-primitives.md`'s note) for their own count-up bands, not this React component — the
comment describes the *pattern*, not a shared *component*.

## Target

Split into two pieces, per the overview's ground rule:

- **`core/ui/stat-band.tsx`**, exported `StatBand` — presentational only:
  ```ts
  {
    title?: string;
    cells: { value: string; label: string }[];
    durationMs?: number; // forwarded to CountUp, default unchanged (4000)
  }
  ```
  Same JSX/Tailwind as today, minus the `getGlobals` call and the `StatKey`-filtering logic —
  those move to the composer.
- **`pages/ui/components/stats-band.tsx`** (kept, shrunk) — the composer: still `async`, still
  takes `{ locale, keys, showTitle }`, calls `getGlobals(locale)` and `getTranslations("pages")`
  exactly as today, builds `cells` from the resolved `StatKey[]`, and renders
  `<StatBand title={...} cells={cells} />` from `@core/ui`.

## Migration steps

1. Create `src/core/ui/stat-band.tsx` with the presentational half (title/cells/durationMs props,
   same markup).
2. Export `StatBand` from `src/core/ui/index.ts`.
3. Shrink `src/slices/pages/ui/components/stats-band.tsx`: keep the `async` signature and the
   `getGlobals`/`getTranslations` calls, remove the JSX, build `cells` from `globals.stats`, and
   return `<StatBand title={t("stats.title")} cells={cells} />` (title only passed when
   `showTitle` is true, matching today's conditional).
4. No change needed at the `home-page.tsx` call site — it still imports `StatsBand` from
   `./components/stats-band`.

## Verification (component-specific, on top of the shared DoD in 00-overview §6)

- [ ] Home's stats band (title + 4-cell grid + count-up) renders pixel-identical.
- [ ] The "no title" variant (`showTitle={false}`, if any current call site uses it) still omits
      the heading and the extra top margin.
- [ ] Band still renders `null` end-to-end when `getGlobals` returns nothing or all keys are empty
      (verify by temporarily clearing settings in a local DB check, or by code inspection of the
      composer's early-return logic).
