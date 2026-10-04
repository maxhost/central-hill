# Spec index — Home's sections as a reusable `core/ui` component library

> **Scope:** cross-cutting (`core/ui` kernel + `pages`/`settings` slices) · **Status:** ✅ ADR 0033
> Accepted (2026-10-03, `docs/decisions/README.md#0033`) — **all 8 components implemented**
> (2026-10-03/04), see the table in §5. A real dev-server pass caught one runtime bug that
> `typecheck`/`lint` missed — `Hero` importing `@core/media` directly broke every page with a
> 500 once it joined the `core/ui` barrel (Turbopack can't bundle `sharp` for the client); fixed
> by giving `Hero` a caller-built `background: ReactNode` prop instead, see `02-hero.md`. This is
> the concrete reason every component spec's DoD requires a browser check, not just a clean
> `typecheck`/`lint` — confirms it wasn't a redundant step.
> **Page under review:** `http://localhost:4455/es` = `/[locale]` (Home), composed in
> `src/slices/pages/ui/home-page.tsx`.
> **Explicitly scoped to Home only.** The `.mk`-HTML-string pages (About/Guests/Owners/Real
> Estate/Buildings) are **out of scope** — see `docs/specs/handoff-2026-10-03-b.md` Part 2 for that
> separate, still-open architecture question. Nothing here resolves or blocks it.

This used to be one large spec file. **It's split per component now** so an agent picking up one
piece only needs this overview (short) + that one component's file — not the whole thing. Read
this file first, always; then open only the component file(s) you're working on.

---

## 1. Goal

Pull Home's section components out of `src/slices/pages/ui/components/` — where no other slice
may import them (golden rule 2: cross-slice access only via `contract.ts`) — into `src/core/ui/`,
so any future screen in any slice can compose the same hero/stats/carousel/two-column/CTA pieces,
animations included, by importing one shared primitive instead of re-implementing it.

## 2. Why this needed an ADR, not just a refactor

`CLAUDE.md` golden rule 3: *"`src/core/` … changes only via an ADR. Feature agents do not edit it
ad-hoc."* Moving components into `core/ui` **is** a kernel change, no matter how small each diff
looks. §8 below is the ADR content — now landed as **ADR 0033, Accepted (2026-10-03)** in
`docs/decisions/README.md#0033`. Implementation may proceed, component by component, per §5.

## 3. Ground rule every component file follows: presentational vs. data composer

`src/core/ui` today (`container.tsx`, `section.tsx`, `eyebrow.tsx`, `button.tsx`) has **zero
imports from any slice** — pure, prop-driven presentation. That must stay true. Several of Home's
current components violate it because they also fetch their own data (e.g. `StatsBand` calls
`getGlobals`, `FeaturedPortfolio` calls `getFeaturedBuildings`). The fix, applied identically in
every component file below:

- **Presentational primitive → `core/ui`.** Plain props/children only. No `async`, no contract
  imports, no `next-intl/server`. Reusable from any slice.
- **Data composer → stays in the slice that already owns the fetch** (`pages` or `settings`).
  Thin wrapper: fetches via the other slice's `contract.ts` (golden rule 2, unchanged), resolves
  i18n strings, renders the `core/ui` primitive. `home-page.tsx` keeps calling the composer, never
  the primitive directly — nothing about Home's own rendering changes.

## 4. Proposed file layout

```
src/core/ui/
  index.ts                  # extend: export every new name below
  hero.tsx                  # → 02-hero.md
  stat-band.tsx             # → 03-stat-band.md
  carousel.tsx              # → 04-carousel.md
  two-column-showcase.tsx   # → 05-two-column-showcase.md
  property-card.tsx         # → 06-property-card.md
  dual-cta-panels.tsx       # → 07-dual-cta-panels.md
  motion/
    reveal.tsx              # → 01-motion-primitives.md
    count-up.tsx            # → 01-motion-primitives.md
  nav-bar.tsx                # → 08-nav-chrome.md
  mobile-drawer.tsx          # → 08-nav-chrome.md
  footer.tsx                 # → 08-nav-chrome.md (added 2026-10-04, on request)
```

## 5. Component index — read in this order

| # | Component(s) | Spec file | Risk | Notes |
|---|---|---|---|---|
| 1 | `Reveal`, `CountUp` | [`01-motion-primitives.md`](./01-motion-primitives.md) | lowest | ✅ IMPLEMENTED (2026-10-03) |
| 2 | `Carousel` | [`04-carousel.md`](./04-carousel.md) | low-medium | ✅ IMPLEMENTED (2026-10-03) |
| 3 | `Hero` | [`02-hero.md`](./02-hero.md) | lowest | ✅ IMPLEMENTED (2026-10-04) |
| 4 | `StatBand` | [`03-stat-band.md`](./03-stat-band.md) | medium | ✅ IMPLEMENTED (2026-10-04) |
| 5 | `TwoColumnShowcase` | [`05-two-column-showcase.md`](./05-two-column-showcase.md) | medium | ✅ IMPLEMENTED (2026-10-03) |
| 6 | `PropertyCard` | [`06-property-card.md`](./06-property-card.md) | medium | ✅ IMPLEMENTED (2026-10-04) |
| 7 | `DualCtaPanels` | [`07-dual-cta-panels.md`](./07-dual-cta-panels.md) | medium | ✅ IMPLEMENTED (2026-10-03) |
| 8 | `NavBar`, `MobileDrawer`, `Footer` | [`08-nav-chrome.md`](./08-nav-chrome.md) | higher | ✅ IMPLEMENTED (`NavBar`/`MobileDrawer` 2026-10-03, `Footer` 2026-10-04) |

Each file is self-contained: current state (file:line), target API, migration steps, and a DoD
checklist scoped to that one component. None of them repeat §1–§4 above — they assume you've read
this file.

## 6. Shared Definition of Done (applies to every component file; not repeated per-file)

- [ ] The ADR (§8) is Accepted before this component's commit lands.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green after the change.
- [ ] `git status` shows changes only in `src/core/ui/**` + the one slice composer file being
      shrunk — no unrelated slice touched.
- [ ] Home (`/[locale]`, all 4 locales) renders pixel-identical before/after (manual browser
      check — two prior sessions both flagged "not visually verified in a real browser" as a gap;
      don't repeat it here).
- [ ] No new i18n keys needed (strings stay props, resolved by the composer same as today).
- [ ] `core/ui/index.ts` exports the new name(s) with a one-line doc comment.

## 7. Explicitly out of scope (every component file inherits this)

- Any `.mk` page (About/Guests/Owners/Real Estate/Buildings/Services listing).
- The full paradigm-unification ADR from `handoff-2026-10-03-b.md` Part 2.
- New screens actually consuming these components (this spec only makes them available).

## 8. Draft ADR content (for `docs/decisions/README.md`, pending next free number)

**Context:** as §1–§3 above, detailed per-component in files 01–08.
**Decision:** extract Home's presentational section components into `core/ui`, split from their
data-fetching composers which stay slice-owned; delete the two duplicate carousel-track
implementations in favor of one shared `Carousel`. Scoped to Home only — does not touch any `.mk`
page, does not decide the broader paradigm question from `handoff-2026-10-03-b.md` (left for a
later, separate ADR).
**Consequences:** `core/ui` grows from 5 files to ~11–13; any future screen gets a hero/stats/
carousel/two-column/property-card/dual-cta kit for free. No visual change to Home (pure refactor).
`.mk` pages still each reimplement these patterns in raw CSS — unchanged by this ADR, tracked
separately.
**Status:** proposed, pending user sign-off.
