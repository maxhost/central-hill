# Component spec — `TwoColumnShowcase`

> Part of [`00-overview.md`](./00-overview.md) — read that first for the ADR requirement and the
> presentational/composer ground rule. **Order: 5th.**

## Current state

`src/slices/pages/ui/components/guests-section.tsx` (91 lines), exported `GuestsSection` — Home's
"guests pitch" / "Image Showcase" section. **Already fully presentational**: content is resolved
upstream in `home-page.tsx`; the component takes `content` + an optional resolved `image` and
renders. No split needed here, unlike `StatBand`/`DualCta` — this is a generalization, not a
data/presentation split.

Props today:
```ts
{
  content: {
    headline: string;
    subheadline?: string;
    benefits: IconCard[];       // only the first 4 are rendered (`.slice(0, 4)`)
    image_media_id?: string;
    cta: CtaNote;                // { url, label, note? }
  };
  image?: MediaImageData | null; // falls back to a hotlinked Unsplash photo if absent
}
```
Layout: 2-col grid (`lg:grid-cols-2`), copy + benefit list + CTA on one side, a 4:5 image with a
floating reassurance-note badge on the other; image is `order-first` on mobile. Section uses a
custom `altBg` (warm band) + an inline `paddingBlock` override (10% tighter than the kernel
`Section`'s standard rhythm — a deliberate, documented deviation, not a bug).

This is pattern **#2 ("Image Showcase")** from the prior session's cross-page inventory — Owners'
`.owner-showcase` and Real Estate's `.asset-showcase` reimplement the same visual idea as raw `.mk`
CSS. This spec does not touch those (out of scope, overview §7); genericizing this component now
just means the target already exists the day someone migrates one of those pages later.

**Used by:** only `home-page.tsx` — confirmed, no other importer (`GuestsSection` is distinct from
the `guest-page.tsx`/Guests route, which is a `.mk` page and doesn't import this component).

## Target

`src/core/ui/two-column-showcase.tsx`, exported `TwoColumnShowcase`:
```ts
{
  eyebrow?: string;
  headline: string;
  body?: string;                 // generalized name for `subheadline`
  bullets?: { icon?: string; title: string; description: string }[]; // generalized name for `benefits`, caller caps the count it passes
  cta?: { href: string; label: string; note?: string };
  image: ReactNode;               // caller passes its own <MediaImage>/<img> — keeps @core/media out of core/ui
  imagePosition?: "left" | "right"; // default "right", matches today's order-last on desktop
  tone?: "default" | "alt";        // "alt" = today's altBg band
}
```
Note the `image` prop is a `ReactNode`, not a `MediaImageData` — `core/ui` must not depend on
`@core/media`'s resolution types beyond what it already re-exports; the caller builds the
`<MediaImage>`/`<img>` (with its own fallback logic) and passes the element in, exactly like
`PropertyCard`/`Carousel` already do with their slides.

The floating badge (today tied to `content.cta.note`) becomes a simple `cta.note` rendered as the
badge when present — same behavior, generalized name.

## Migration steps

1. Create `src/core/ui/two-column-showcase.tsx` with the props above; port the JSX from
   `guests-section.tsx` almost verbatim (rename `headline`/`subheadline`→`body`/`benefits`→
   `bullets`, swap the inline `<MediaImage>`/`<img>` branching for the `image` prop).
2. Export `TwoColumnShowcase` from `src/core/ui/index.ts`.
3. Shrink `src/slices/pages/ui/components/guests-section.tsx` to a thin wrapper: keep the
   `GuestsContent` type and the `SHOWCASE_IMG`/sizing fallback logic (building the `image`
   `ReactNode` exactly as today), map `content` into the new prop names, and render
   `<TwoColumnShowcase tone="alt" imagePosition="left" .../>` (today's image is `order-first` on
   mobile / last on desktop — confirm which `imagePosition` reproduces that, since the prop here
   is about desktop column order, not the mobile stacking which stays CSS-driven inside the
   component itself).
4. Keep the `altBg` padding override exactly as today — either pass `tone="alt"` and move the
   inline `paddingBlock` override into the `core/ui` component (parameterized, e.g. a `compact`
   boolean), or keep the override as a wrapping `className` from the composer. Pick whichever
   keeps the diff smallest; document the choice in this file once decided.
5. No change needed at the `home-page.tsx` call site.

## Verification (component-specific, on top of the shared DoD in 00-overview §6)

- [ ] Home's guests-pitch section renders pixel-identical: headline, subheadline, 4 benefit items,
      image with floating badge, CTA button + note.
- [ ] Mobile: image still stacks above the copy (`order-first` behavior preserved).
- [ ] The 10%-tighter padding override is still exactly `clamp(57.6px, 9vw, 144px)`, not
      accidentally reset to the kernel `Section`'s default rhythm.
