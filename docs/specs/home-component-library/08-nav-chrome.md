# Component spec — `NavBar` / `MobileDrawer` shell (optional)

> Part of [`00-overview.md`](./00-overview.md) — read that first for the ADR requirement and the
> presentational/composer ground rule. **Order: 8th, optional.** Lower priority than every other
> file here — read "Why this is different" before starting.

## Why this is different from every other component in this spec

Hero/Stats/Carousel/TwoColumn/PropertyCard/DualCta all repeat **within** Home and would repeat
**across** future pages — extracting them is a direct, immediate reuse win. The navbar and footer
are not like that: there is exactly **one instance of each**, mounted once in
`src/app/[locale]/layout.tsx` (`SiteHeader`, `SiteFooter`), so every current *and future* route
under `/[locale]/**` already gets them for free, with zero extra work per screen. **"Reusable in
new screens" is already true for them today, by construction** — no new screen needs this spec to
get a navbar.

What this spec item *would* buy: splitting the generic chrome mechanics (sticky bar, hover
dropdown, mobile drawer shell) out of `site-header.tsx`/`site-footer.tsx`'s page-specific,
hardcoded business logic (`OWNERS_SECTIONS`/`REAL_ESTATE_SECTIONS`/`ABOUT_SECTIONS` arrays, the
`OWNERS_NAV_CSS` scroll-pin hack tied to `body:has([data-page="owners"])`, the `#booking-engine`
anchor). That's consistency with the rest of this spec's pattern, not urgency — **do this last,
and skip it entirely if review time is short.**

## Current state

- **`src/slices/settings/ui/site-header.tsx`** (286 lines) — `async`, calls `getNav(locale,
  "header")` + `getTranslations("settings")`, merges in three hardcoded per-page section-anchor
  arrays, renders the sticky bar + hover-dropdown nav + two persistent CTAs + utilities cluster +
  `<MobileNav>`.
- **`src/slices/settings/ui/components/mobile-nav.tsx`** (144 lines) — `"use client"`, already
  takes fully resolved, serializable props (`NavEntry[]`, `NavCta`, plain label strings) — no data
  fetching of its own. Closer to presentational than `site-header.tsx`, but still settings-slice-
  specific (imports `ContactDialog` from the same slice).
- **`src/slices/settings/ui/site-footer.tsx`** (177 lines) — `async`, calls `getGlobals(locale)` +
  `getNav(locale, "footer")` + `getTranslations("settings")`.

## Target (if pursued)

- **`core/ui/nav-bar.tsx`**, exported `NavBar` — the sticky bar + hover-dropdown mechanics only:
  ```ts
  {
    brand: ReactNode;                 // caller's logo/wordmark element
    links: { label: string; href: string; children?: { label: string; href: string }[] }[];
    ctas?: ReactNode;                  // caller's own CTA buttons (keeps ButtonLink out of core if desired, or just accept ReactNode)
    utilities?: ReactNode;             // contact/login/locale-switcher cluster
    mobileDrawer: ReactNode;           // caller renders its own <MobileDrawer> or a wrapped one
    skipLinkLabel: string;
    skipLinkHref?: string;             // default "#main"
  }
  ```
  No `OWNERS_NAV_CSS`, no hardcoded section arrays, no `getNav`/`getTranslations` — all of that
  stays in `site-header.tsx`, which builds `links` (merging DB nav + the three hardcoded
  overrides, unchanged) and passes them in.
- **`core/ui/mobile-drawer.tsx`**, exported `MobileDrawer` — same `NavEntry`/`NavCta` prop shapes
  `mobile-nav.tsx` already defines, minus the `ContactDialog` import (passed as a `children`/slot
  prop instead, so `core/ui` doesn't depend on settings' contact-dialog component).
- Footer: lower value to split further — `site-footer.tsx`'s markup is less reusable-shaped (no
  second instance anywhere), so this spec does **not** propose a `core/ui/footer.tsx`. Revisit
  only if a second, different footer context ever appears (e.g. a backoffice-facing public page).

## Migration steps (if pursued)

1. Create `core/ui/mobile-drawer.tsx` first (simpler, already near-presentational) — port
   `mobile-nav.tsx`'s JSX, replace the inline `<ContactDialog>` with a `contactSlot: ReactNode`
   prop.
2. Create `core/ui/nav-bar.tsx` — port `site-header.tsx`'s chrome JSX (bar, dropdown mechanics,
   skip link), leave every data-dependent piece (`getNav`, the three hardcoded section arrays,
   `OWNERS_NAV_CSS`, the CTAs' actual hrefs) in `site-header.tsx` as the composer, passed through
   as props.
3. Export both from `core/ui/index.ts`.
4. Update `site-header.tsx` to import `NavBar`/`MobileDrawer` from `@core/ui`, build the props,
   and keep `OWNERS_NAV_CSS` as a `<style>` tag rendered by the composer (not inside `NavBar`
   itself — it's page-specific, not chrome).
5. Delete `mobile-nav.tsx` only after `site-header.tsx` is fully repointed and verified.

## Verification (component-specific, on top of the shared DoD in 00-overview §6)

- [ ] Header: sticky behavior, transparent-over-hero → frosted-on-scroll transition unchanged.
- [ ] Hover dropdowns (incl. Owners'/Real Estate's/About's hardcoded sub-tabs, incl. the
      scroll-pin behavior on the Owners page) unchanged.
- [ ] Mobile drawer: open/close, all links + both CTAs + contact trigger + owner-login link,
      identical.
- [ ] Skip-to-content link still present and functional.
- [ ] No regression on any of the four pages whose nav sub-tabs are hardcoded
      (Owners/Real Estate/About) or on Home (no hardcoded sub-tabs there).
