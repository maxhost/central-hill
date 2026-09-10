# Spec — Restyle the Avantio search bar and float it on the hero seam

> **Follows:** `docs/specs/avantio-search-widget.md` (the integration, shipped in `12c1539`)
> **Slice:** `settings` (owns the widget) · **Consumer:** `pages` (Home)
> **Status:** implemented · **No DB, no migration, no schema change**
> **As built:** see §12 — one finding below turned out to be wrong and is corrected there.

---

## 1. Goal

Bring the Avantio search bar visually in line with the client's reference image — a rounded
white card with no internal dividers and a rounded accent button carrying a magnifier icon —
and move it so it **floats on the seam** between the hero and the "A Trusted and Leading
Company" stats band instead of sitting in its own band between them.

## 2. Interpretation of the placement request

"A medio entre el hero y el div de *Una Empresa de Confianza y Líder del Sector*" is read as
**straddling the boundary**: the card sits half over the hero image and half over the dark
stats band, floating on its own shadow, as in the reference. It already sits *between* the two
today, so a literal reading would mean no move at all.

**On mobile the card does not straddle.** Below Avantio's own 550px breakpoint the fields stack
and the card becomes several hundred pixels tall; overlapping that across the seam looks broken.
Under 880px it renders as a normal band between the two sections, as it does now.

## 3. What is and is not achievable

Established by inspecting the live widget and its stylesheets — see §7 of the integration spec.

**Achievable with our own CSS (this task):** card shape, border, shadow, background; removing
the vertical dividers between fields; label and placeholder typography; the button's colour,
radius, inset, casing and icon; the datepicker's colours; the children-ages popover.

**Not achievable from our side:** the *set of fields*. Ours are `Dates` (one combined
"From - To" input), `Zone` (select), `Adults`, `Children`. The reference has `Your Destination`,
separate `Check-in` / `Check-out` with a "0 nights" badge, and a combined `Guests and rooms`.
All four `formato` values Avantio exposes return the same four fields, and the
`flexible-search-form` markup its stylesheet references is not enabled on the account. Changing
this is an Avantio-side configuration request.

**Correction to an earlier statement:** the datepicker's pink does *not* require an Avantio
request. `#ui-datepicker-div` is rendered at the body root of *our* page, so our CSS reaches it.
Asking Avantio to change the account colours only matters for the booking-engine pages hosted on
their domain, which we do not control. Worth asking anyway for end-to-end consistency, but this
task does not depend on it.

## 4. Cascade — the part that must be right

Avantio's stylesheets currently render **in the body, after our Next CSS chunk**, and the
fragment carries a third `<link>` (`flexible-search.css`) that the client island injects at
mount, landing after everything else. Any override we write has to survive that.

Fix the order deterministically instead of fighting it with `!important`:

1. **Strip the `<link>` out of the fetched fragment** in `getAvantioSearchBar`, the same way
   `<script>` tags are already stripped, and return its href alongside the markup.
2. **Render all three vendor stylesheets ourselves**, in a fixed order:
   `flexible-search.css` → `formulario-style.css` → `fontlibrary.css`.
3. **Render our overrides as a `<style>` element immediately after them**, matching the repo's
   existing `PAGE_STYLE` pattern. A `<style>` later in document order beats a `<link>` earlier
   in it at equal specificity, regardless of which finishes loading first.

This also removes a flash of unstyled widget at mount, since the fragment's stylesheet no longer
arrives late.

Our selectors must **match Avantio's specificity**, which reaches three chained IDs
(`#miniformulario_slider #sombrap #tabla_form …`). Mirror those selectors rather than inventing
shorter ones. Reserve `!important` for the few declarations where the vendor already uses it —
`#tabla_form { display:flex !important }` and `#ui-datepicker-div { z-index:1000 !important }` —
and only if a rule actually has to fight one of those.

## 5. Visual spec

Reference → Warm Editorial tokens (`src/app/globals.css @theme`, ADR 0022). **No raw hex** other
than the vendor colours being replaced.

| Element | Selector | Target |
|---|---|---|
| Card | `#miniformulario_slider #sombrap` | `--color-surface` background, `1px solid --color-line`, radius `14px`, soft shadow, `overflow: hidden` |
| Field row | `#miniformulario_slider #sombrap #tabla_form` | keep `display:flex`; vertical padding trimmed so the card reads ~90px tall on desktop |
| Dividers | `#tabla_form > * + *:not(#contenido_buscar)` | `border-left: none` — the reference has none |
| Labels | `#tabla_form .form_item label` | `--color-ink`, 600 weight, ~13px, normal casing |
| Inputs / selects | `#tabla_form .form_item input, … select` | `--color-ink` text, `--color-ink-soft` placeholder, `outline-color: --color-accent` |
| Button cell | `#tabla_form #contenido_buscar` | drop the `#f5f6fa` background, add padding so the button insets from the card edge |
| Button | `#tabla_form #contenido_buscar a` | gradient `--color-accent` → `--color-accent-deep`, `--color-surface` text, radius `10px`, `text-transform: none`, magnifier via `::before` using the already-loaded `fontlibrary` font |
| Datepicker | `#ui-datepicker-div a.ui-state-default.ui-state-active`, `.ui-state-hover`, `.ui-datepicker-close`, `.ui-datepicker-days-cell-over .ui-state-default` | replace `#dc3776` with `--color-accent` |
| Autocomplete | `li.ui-autocomplete-category`, `li.ui-menu-item:hover` | replace `#dc3776` with `--color-accent` |
| Children popover | `.popover .cerrar_ninyos`, `.bloque_edadesNinyos #acepta_ninos .botonNinyo` | replace `#1b5d63` with `--color-accent` |

Typography: the vendor pins Open Sans via `@font-face`. Override `font-family` on `#sombrap` to
`--font-sans` (Inter) so the widget matches the rest of the page. The icon font must stay, since
the button glyph and the datepicker arrows depend on it.

**Two colours, not one.** `#1b5d63` (button, popover confirm, input focus ring) and `#dc3776`
(the entire datepicker and autocomplete). Missing the second is the usual way this job looks
half-done — the bar matches the brand until a visitor opens the calendar.

## 6. Placement

Current composition in `home-page.tsx`:

```
<PageHero />
<AvantioSearchBar />   ← own section: bg-surface, border-b, py-6 md:py-8
<StatsBand />          ← bg-feature (dark)
```

Target: the section loses its own background and border, becomes `relative z-20`, and pulls
itself onto the seam with equal negative margins top and bottom, so it occupies no net vertical
space in the flow and overlaps both neighbours.

- Drive the offset from a single custom property, e.g. `--avantio-overlap`, so the two margins
  cannot drift apart.
- Apply it only at `min-width: 880px`; below that the section keeps normal flow with modest
  vertical padding.
- The measured desktop card height is **90px**, so half is 45px. Verify after restyling — the
  padding changes in §5 move it — and set the property from the measured value rather than
  assuming.
- The card needs `z-index` above the stats band and a shadow strong enough to read against both
  the hero photo and the dark band.

Watch for: the hero's bottom padding may need a small increase so the card does not crowd the
CTA buttons, and the stats band's top padding may need one so the heading clears the card.

## 7. Optional, only if it looks right

The fragment carries a hidden `FRMNoches` input with `data-translation="night,nights"`, which
the datepicker populates. A small observer could mirror it into a visible "N nights" pill
between the date field and the zone field, echoing the reference's badge. It is genuinely
optional: it adds a runtime dependency on a vendor field name, and it should be dropped rather
than debugged if it proves flaky.

## 8. Files touched

All inside the `settings` slice plus one line in `pages`. **Nothing in `src/core/`, no ADR
needed** — the tokens are consumed, not changed.

```
src/slices/settings/server/avantio-widget.ts        strip + return the fragment stylesheet href
src/slices/settings/ui/components/avantio-styles.ts new — the override CSS string
src/slices/settings/ui/components/avantio-search-bar.tsx  render sheets in order + <style>, seam offset
src/slices/settings/ui/components/avantio-search-bar-client.tsx  (only if the strip changes its props)
src/slices/settings/README.md                       document the override layer
src/slices/pages/ui/home-page.tsx                   only if the seam offset needs a wrapper change
```

## 9. Verification

Repeat the integration spec's browser checks — this restyle must not break the widget:

- form in the DOM with 62 inputs, correct per-locale action and xajax endpoint, jQuery 3.4.1,
  `validaForm` / `enviaForm` defined, **zero console errors**;
- computed `background-color` on `#contenido_buscar a` equals the accent token, proving our
  `<style>` won the cascade;
- computed `font-family` on `#sombrap` is Inter, not Open Sans;
- **the datepicker open**, screenshotted, confirming no pink survives;
- screenshots at 1440px and 390px showing the seam overlap on desktop and the normal band on
  mobile;
- `pnpm typecheck`, `pnpm lint` and a clean production build.

## 10. Definition of Done

- [ ] Card, dividers, labels, button and datepicker match §5; no raw hex beyond the replacements.
- [ ] Overrides win the cascade by document order, not by blanket `!important`.
- [ ] Desktop straddles the seam; mobile does not.
- [ ] Widget still works: browser checks in §9 pass with zero console errors.
- [ ] Before/after screenshots at both widths, calendar open in at least one.
- [ ] Only the files in §8 changed; slice README updated.
- [ ] The field-set limitation from §3 is written down as an open Avantio request.

## 11. Open request for Avantio (not blocking)

1. Set the account brand colours: `#1b5d63` and `#dc3776` → Warm Editorial accent.
2. Ask whether the flexible-search variant can be enabled on `bk_centralhill` — separate
   check-in / check-out with the nights counter, free-text destination, combined guests. That is
   the only way to close the remaining gap to the reference image.

---

## 12. As built

Implemented as specified, with three corrections and two deliberate omissions.

**§5 was wrong about the datepicker: there are three vendor brand colours, not two.**
`flexible-search.css` — the sheet §4 treats purely as a cascade nuisance — is not inert. It owns
the **two-month range** datepicker (`#ui-datepicker-div.av-datepicker-range`), which is the picker
this account actually opens, and paints it green: `#3BDC8D` for the selected end-points and the
hovered day (with `!important`), `#C8F5DF` for the band between check-in and check-out. The pink
`#dc3776` rules §5 lists belong to the *single-month* picker and never render here. Replacing only
`#1b5d63` and `#dc3776`, as §5 instructs, would have left the calendar green — the exact failure
mode §5's own warning describes, one sheet further along. `flexible-search.css` also pins
`Open Sans !important` on the calendar. Both are handled in `avantio-styles.ts`.

**Reordering the sheets changes a vendor-vs-vendor conflict.** Because §4 moves
`flexible-search.css` from last (island-injected) to first, `formulario-style.css` now wins ties
against it. The one that matters is `#ui-datepicker-div .ui-datepicker-days-cell-over
.ui-state-default`, where the sheets disagree between `background: transparent` and an opaque
white — the white would hide the in-range wash. Settled explicitly in our own rule rather than
left to load order.

**The card does not get `overflow: hidden`.** §5 asks for it, but the children-ages popover is
positioned absolutely and hangs below the bar, so clipping the card would clip the popover. With
the dividers and the button cell's grey background gone, nothing needs clipping anyway.

**The mobile search button had to be un-stuck.** Not in the spec, found in client review: the
vendor sets `#sombrap #contenido_buscar { position: sticky; bottom: 0 }` under 550px, which pins
the button to the *viewport* bottom rather than the card's — it rides up over the fields (the
sticky also gives it its own stacking context) and only drops into place once the card's bottom
scrolls into view. That behaviour suits a full-height booking drawer, not a card sitting in the
page flow. Returned to `position: static` at the foot of the form, and its `::before` fade — which
exists only to blur content scrolling under a sticky button — set to `content: none`.

**§7 (the "N nights" pill) was not built**, per its own instruction to drop rather than debug it.

**Measured card height is 89px**, so `--avantio-overlap` is 44.5px. The value is derived in
`avantio-styles.ts` from a single `CARD_HEIGHT_PX` constant.

### Verification (headless Chrome over CDP, dev server, 2026-09-10)

| Check (§9) | Result |
|---|---|
| Form in the DOM | ✅ 65 inputs/selects, action `https://www.centralhill.pt/rentals/formularioMiniOptimized.php`, xajax endpoint `…/en/rentals/gestorFormulario.php` |
| jQuery / handlers | ✅ 3.4.1; `validaForm` and `enviaForm` both `function` |
| Console | ✅ **zero** errors, warnings or exceptions across desktop and mobile loads |
| Overrides won the cascade | ✅ `styleAfterLinks: true`; link order `globals → flexible-search → formulario-style → fontlibrary`; button `rgb(181,86,45)` = `--color-accent` |
| Font | ✅ `#sombrap` and the calendar both compute to Inter, not Open Sans |
| Dividers | ✅ all three inter-field borders `0px` |
| Datepicker | ✅ opened and screenshotted; **0 elements** left carrying `#dc3776`, `#1b5d63`, `#3BDC8D` or `#C8F5DF`; hovered day `rgb(181,86,45)` |
| Seam | ✅ 1440px: margins `-44.5px` top and bottom, card straddles. 390px: margins `0`, normal band |
| Mobile button | ✅ 390px, sampled at six scroll positions: `position: static`, constant 320px from the card top, 1px above its bottom edge |
| Build | ✅ `pnpm typecheck`, `pnpm lint` (0 errors), `pnpm build` all green |

Screenshots taken during verification (desktop seam, calendar open, mobile band) were reviewed
and not committed; re-capture with the CDP recipe in the env notes if they are needed again.

§11's open request to Avantio stands, with one addition: the account colour change should cover
`#3BDC8D` as well.
