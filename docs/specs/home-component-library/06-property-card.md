# Component spec — `PropertyCard`

> Part of [`00-overview.md`](./00-overview.md) — read that first for the ADR requirement and the
> presentational/composer ground rule. **Order: 6th.** Depends on `04-carousel.md` landing first
> (this card is one of the `slides` fed into `Carousel`).

## Current state

Lives inline inside `src/slices/pages/ui/components/featured-portfolio.tsx` (141 lines total) as
a private function `PortfolioCard`, not exported. Already presentational given its inputs — it
takes a resolved `BuildingSummary` + a `t` translator function, no fetching of its own.

Current shape (not a clean prop interface today — tied directly to `BuildingSummary` and the
`pages` i18n namespace):
```ts
function PortfolioCard({
  locale: Locale;
  building: BuildingSummary;   // { id, slug, name, cover, isFeatured, stats: { apartments, capacity } }
  priority: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
})
```
Renders: `4:3` cover image (`MediaImage`), a "★ Featured" badge when `isFeatured`, building name
(serif), a meta line (`"X apartments · Y guests"`, built via `t("portfolio.apartments", {count})`
+ `t("portfolio.guests", {count})`), and a "View" link-style label — the whole card is one `<Link>`
to `/{locale}/buildings/{slug}`. Hover: `-translate-y-1` + shadow lift, image `scale-[1.04]`.

**Used by:** only `featured-portfolio.tsx`, feeding `PortfolioCarousel`/(future) `Carousel`.

## Target

`src/core/ui/property-card.tsx`, exported `PropertyCard` — generalized away from `BuildingSummary`
and `next-intl`, taking only strings the caller already resolved:
```ts
{
  href: string;
  image: ReactNode;        // caller's <MediaImage>, same pattern as TwoColumnShowcase's image prop
  name: string;
  meta: string;             // pre-joined "X apartments · Y guests" — i18n stays in the composer
  badge?: string;            // pre-translated "★ Featured" label, omitted entirely when absent
  viewLabel: string;         // pre-translated "View" label
}
```
Hover/transition classes copied verbatim.

## Migration steps

1. Create `src/core/ui/property-card.tsx` with the props above; port the JSX from
   `PortfolioCard` verbatim, replacing the `MediaImage`/badge/meta-string construction with the
   already-resolved props.
2. Export `PropertyCard` from `src/core/ui/index.ts`.
3. In `featured-portfolio.tsx`, replace the private `PortfolioCard` function with a call site that
   builds the props (`href`, the `<MediaImage>` element, `meta` via the existing `t(...)` calls
   joined the same way, `badge` only when `building.isFeatured`, `viewLabel` via
   `t("portfolio.view")`) and renders `<PropertyCard {...} />` from `@core/ui`.
4. Delete the old private `PortfolioCard` function once the call site is updated and verified.

## Verification (component-specific, on top of the shared DoD in 00-overview §6)

- [ ] Featured portfolio cards render pixel-identical: image, featured badge (only when
      applicable), name, meta line, "View" label, hover lift + image zoom.
- [ ] Non-featured buildings render with no badge element at all (not an empty one).
