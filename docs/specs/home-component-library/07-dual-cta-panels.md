# Component spec — `DualCtaPanels`

> Part of [`00-overview.md`](./00-overview.md) — read that first for the ADR requirement and the
> presentational/composer ground rule. **Order: 7th.** Needs the presentational/composer split
> (see overview §3).

## Current state

`src/slices/pages/ui/components/dual-cta.tsx` (147 lines), exported `DualCta` — Home's
owner/guest "Immersive Panels" closing band. **Not** pure presentational: `async`, calls
`getGlobals(locale)` (settings contract, for the contact line) and `getTranslations("pages")`
(for fallback copy when a panel field is unset).

Props today:
```ts
{
  locale: Locale;
  content?: { owner?: Panel; guest?: Panel }; // Panel = { image_media_id?, eyebrow?, title?, body?, cta_label? }
  media?: Record<string, MediaImageData>;
}
```
Two full-bleed image panels (owner → `/owners`, guest → the Avantio booking URL via
`avantioBookingUrl(locale)`), dark gradient scrim, white copy, hover image zoom (CSS-only, no JS).
Edge-to-edge layout (no `Container`). No reveal animation (two-panel/single-block rule — only
hover). Every field has a per-locale i18n fallback (`pages.dualCta.*`) when the CMS field is
empty, plus a hardcoded Pexels fallback photo per panel when no R2 asset is set.

**Used by:** only `home-page.tsx` — confirmed, no other importer.

## Target

Split per the overview's ground rule:

- **`core/ui/dual-cta-panels.tsx`**, exported `DualCtaPanels` — presentational only:
  ```ts
  {
    panels: [Panel, Panel];
  }
  type Panel = {
    image: ReactNode;          // caller's <MediaImage>/<img>, fallback already resolved by composer
    eyebrow: string;            // already resolved (CMS value or i18n fallback)
    title: string;
    body: string;
    cta: { href: string; label: string; variant?: "primary" | "light" };
    contactLine?: string;       // pre-joined "phone · email · WhatsApp ..." or undefined
  };
  ```
  No `Locale`, no `getGlobals`, no `getTranslations` — every string arrives already resolved.
- **`pages/ui/components/dual-cta.tsx`** (kept, shrunk) — the composer: keeps the `async` fetch of
  `getGlobals`/`getTranslations`, keeps `OWNER_IMG`/`GUEST_IMG`/`PanelImage` fallback-image logic
  (building each panel's `image` `ReactNode`), keeps the owner/guest contact-line joins, and
  builds the two `Panel` objects before rendering `<DualCtaPanels panels={[ownerPanel,
  guestPanel]} />`.

## Migration steps

1. Create `src/core/ui/dual-cta-panels.tsx` with the presentational half (two-panel grid, scrim,
   copy block, CTA button, optional contact line) — port the JSX verbatim, replacing the
   `owner?.field || t(...)` fallback chains with plain resolved strings.
2. Export `DualCtaPanels` from `src/core/ui/index.ts`.
3. Shrink `src/slices/pages/ui/components/dual-cta.tsx`: keep every fallback/resolution branch
   exactly as today (owner/guest contact joins, `PanelImage` fallback logic, the
   `avantioBookingUrl` link for the guest CTA), assemble the two `Panel` objects, and render
   `<DualCtaPanels panels={[owner, guest]} />`.
4. No change needed at the `home-page.tsx` call site.

## Verification (component-specific, on top of the shared DoD in 00-overview §6)

- [ ] Owner panel → `/owners`, solid `ButtonLink` style; guest panel → Avantio booking URL, `light`
      variant — both unchanged.
- [ ] Every CMS-field-unset fallback (eyebrow/title/body/cta_label, per locale) still renders the
      same `pages.dualCta.*` string as today.
- [ ] Both fallback Pexels images still render when no R2 asset is set on a panel.
- [ ] No reveal/entrance animation added (rule: single/two-block sections get no reveal) — only
      the existing hover zoom.
