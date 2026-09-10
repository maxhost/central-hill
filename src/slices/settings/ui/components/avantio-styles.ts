/**
 * Warm Editorial overrides for the Avantio search widget (ADR 0022 tokens; no raw hex beyond
 * the two vendor brand colours being replaced). Spec: `docs/specs/avantio-search-widget-restyle.md`.
 *
 * **How this wins the cascade.** Avantio's sheets are `<link>`s the server component renders
 * ahead of this string, and this string ships as a `<style>` element in the body — later in
 * document order, so at equal specificity it wins regardless of which file finishes loading
 * first. That is why the selectors below deliberately *mirror* the vendor's chained ids
 * (`#miniformulario_slider #sombrap #tabla_form …`) instead of being written shorter: matching
 * its specificity is enough, and `!important` is then unnecessary everywhere except where the
 * vendor itself used it.
 *
 * **Three brand colours, not one.** `#1b5d63` (formulario-style.css) paints the button, the
 * children-ages confirm and the input focus ring. `#dc3776` (same sheet) paints the single-month
 * datepicker and the destination autocomplete. And `#3BDC8D` with its `#C8F5DF` wash
 * (flexible-search.css — the sheet that used to ride inside the fragment) paints the *range*
 * datepicker this account actually opens, with `!important`. Replacing only the first leaves a
 * green calendar behind an otherwise on-brand bar; replacing the first two leaves it green too,
 * because the range picker never uses the pink rules.
 *
 * **Scope.** `#ui-datepicker-div`, `.ui-autocomplete` and `.bloque_edadesNinyos` are appended to
 * the body root by the vendor's jQuery, not inside `#miniformulario_slider`, so their rules
 * cannot be nested under it. The `<style>` only exists on pages that render the widget, so the
 * unscoped selectors stay confined to those pages.
 *
 * Two things this file deliberately does *not* do:
 * - No `overflow: hidden` on the card. It would round the corners for free but also clip the
 *   children-ages popover, which the vendor positions absolutely and lets hang below the bar.
 *   With the dividers and the button cell's grey background gone, nothing needs clipping.
 * - No "N nights" pill mirrored out of the hidden `FRMNoches` input (§7 of the spec, optional):
 *   it buys one badge from the reference image at the price of a runtime dependency on a vendor
 *   field name.
 */

/** Desktop card height, measured in the browser with the padding below applied (headless Chrome,
 * 1440px). Half of it is the seam offset, so the section takes no net space in the flow. */
const CARD_HEIGHT_PX = 89;

/** Below this the fields stack (Avantio's own breakpoint is 550px) and straddling looks broken. */
const SEAM_BREAKPOINT_PX = 880;

export const AVANTIO_STYLE = `
/* ---- Placement: float the card on the hero / stats-band seam (desktop only) ---- */
[data-avantio="search-bar"] {
  position: relative;
  z-index: 20;
  padding-block: 24px;
}
@media (min-width: ${SEAM_BREAKPOINT_PX}px) {
  [data-avantio="search-bar"] {
    /* One property drives both margins so the two halves cannot drift apart. */
    --avantio-overlap: ${CARD_HEIGHT_PX / 2}px;
    padding-block: 0;
    margin-top: calc(var(--avantio-overlap) * -1);
    margin-bottom: calc(var(--avantio-overlap) * -1);
  }
}

/* ---- The card ---- */
#miniformulario_slider #sombrap {
  font-family: var(--font-sans);
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 14px;
  box-shadow:
    0 18px 44px -20px rgb(43 38 34 / 0.45),
    0 2px 6px rgb(43 38 34 / 0.06);
}

/* ---- Field row ---- */
#miniformulario_slider #sombrap #tabla_form > * {
  padding: 18px 20px;
}
/* The reference image has no rules between the fields. */
#miniformulario_slider #sombrap #tabla_form > * + *:not(#contenido_buscar) {
  border-left: none;
}
#miniformulario_slider #sombrap #tabla_form .form_item label {
  display: block;
  margin-bottom: 2px;
  color: var(--color-ink);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
}
#miniformulario_slider #sombrap #tabla_form .form_item input,
#miniformulario_slider #sombrap #tabla_form .form_item select {
  padding: 0;
  min-height: 30px;
  color: var(--color-ink);
  font-size: 15px;
  outline-color: var(--color-accent);
}
/* The vendor forces placeholders to inherit the input colour; walk that back to the soft ink. */
#miniformulario_slider #sombrap #tabla_form .form_item input::placeholder {
  color: var(--color-ink-soft);
  opacity: 1;
}
#miniformulario_slider #sombrap #tabla_form .form_item input::-webkit-input-placeholder {
  color: var(--color-ink-soft);
  opacity: 1;
}

/* ---- Search button ---- */
#miniformulario_slider #sombrap #tabla_form #contenido_buscar {
  /* Drop the vendor's grey cell; the padding insets the button from the card edge. */
  background-color: transparent;
  padding: 16px;
}
#miniformulario_slider #sombrap #tabla_form #contenido_buscar a {
  gap: 8px;
  min-height: 48px;
  padding: 0 24px;
  border-radius: 10px;
  background-color: var(--color-accent);
  background-image: linear-gradient(180deg, var(--color-accent), var(--color-accent-deep));
  color: var(--color-surface);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
  transition: background-image 150ms ease, box-shadow 150ms ease;
}
/* Magnifier from the icon font the widget already loads for the datepicker arrows. */
#miniformulario_slider #sombrap #tabla_form #contenido_buscar a::before {
  content: "\\f50d";
  font-family: "fontlibrary";
  font-size: 16px;
  font-weight: normal;
  line-height: 1;
}
#miniformulario_slider #sombrap #tabla_form #contenido_buscar a:hover {
  background-image: linear-gradient(180deg, var(--color-accent-deep), var(--color-accent-deep));
  box-shadow: 0 6px 16px -6px rgb(43 38 34 / 0.45);
}

/* ---- Stacked layout below Avantio's own 550px breakpoint ---- */
@media (max-width: 550px) {
  #miniformulario_slider #sombrap #tabla_form > * {
    padding: 14px 18px;
  }
  /* The vendor makes the button cell 'position: sticky; bottom: 0' here, which pins it to the
     *viewport* bottom: it rides up inside the card and only drops to its real place once the
     card's bottom scrolls into view — and the sticky's stacking context paints it over the
     fields on the way. Wrong for a card in the page flow rather than a full-height drawer, so
     put it back in normal flow at the foot of the form. */
  #miniformulario_slider #sombrap #contenido_buscar {
    position: static;
    margin-top: 4px;
  }
  /* That cell's ::before is a fade for content scrolling under the sticky button. With the
     button static it has nothing to fade and just paints a band above it. */
  #miniformulario_slider #sombrap #contenido_buscar:before {
    content: none;
  }
}

/* ---- Datepicker (mounted at the body root — cannot be scoped under the widget id) ----
   Two vendor sheets style it. formulario-style.css covers the plain single-month picker (pink);
   flexible-search.css covers the two-month range picker this account actually opens (green).
   Both are answered below. */
.ui-datepicker {
  border-radius: 12px;
  background-color: var(--color-surface);
}
#ui-datepicker-div a.ui-state-default {
  color: var(--color-ink);
}
/* The two sheets disagree here — one wants 'background: transparent', the other an opaque white.
   Settle it: transparent, so the in-range wash below stays visible through the day cell. */
#ui-datepicker-div .ui-datepicker-days-cell-over .ui-state-default {
  color: var(--color-accent);
  background: transparent;
}
#ui-datepicker-div a.ui-state-default.ui-state-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-surface);
}
#ui-datepicker-div a.ui-state-default.ui-state-hover {
  background: var(--color-accent);
  color: var(--color-surface);
}
.ui-datepicker-close {
  color: var(--color-accent);
  font-weight: 600;
}
.ui-datepicker-prev:before,
.ui-datepicker-next:before,
.ui-datepicker-calendar th,
.ui-datepicker-additional-info,
/* flexible-search.css claims the weekday initials with an id selector — match it. */
#ui-datepicker-div th span {
  color: var(--color-ink-soft);
}
.ui-datepicker-title {
  color: var(--color-ink);
}

/* Range picker ('.av-datepicker-range'): the selected end-points and the hovered day. The vendor
   marks these '!important', so this is one of the few places we have to answer in kind. */
#ui-datepicker-div.av-datepicker-range td:hover a,
#ui-datepicker-div.av-datepicker-range .ui-state-active,
#ui-datepicker-div.av-datepicker-range .checkin-selected a,
#ui-datepicker-div.av-datepicker-range .checkout-selected a {
  background-color: var(--color-accent) !important;
  color: var(--color-surface);
}
/* The band between check-in and check-out. Mixed from the accent rather than added as a token,
   so this file still consumes the palette instead of extending it (ADR 0022). */
#ui-datepicker-div.av-datepicker-range .date-range-selected::after,
#ui-datepicker-div.av-datepicker-range .ui-datepicker-mouseover::after,
#ui-datepicker-div.av-datepicker-range .checkin-selected::after,
#ui-datepicker-div.av-datepicker-range .checkout-selected::after {
  background-color: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface));
}
/* Both sheets pin Open Sans on the calendar with '!important', the widget's last holdout. */
#ui-datepicker-div td .ui-state-default,
#ui-datepicker-div td a,
#ui-datepicker-div th span,
#ui-datepicker-div .ui-datepicker-title {
  font-family: var(--font-sans) !important;
}
#ui-datepicker-div td a {
  color: var(--color-ink);
}

/* ---- Destination autocomplete ---- */
.ui-autocomplete {
  border-color: var(--color-line);
  background-color: var(--color-surface);
}
li.ui-autocomplete-category {
  color: var(--color-accent);
}
li.ui-menu-item:hover {
  background-color: var(--color-accent);
}
.ui-menu-item a {
  color: var(--color-ink);
}

/* ---- Children-ages popover ---- */
#miniformulario_slider .popover {
  border-color: var(--color-line);
  border-radius: 10px;
  background-color: var(--color-surface);
}
#miniformulario_slider .popover .cerrar_ninyos {
  border-radius: 8px;
  background-color: var(--color-accent);
}
#miniformulario_slider .popover .ninyo select {
  border-color: var(--color-line);
  color: var(--color-ink);
}
.bloque_edadesNinyos {
  border-color: var(--color-line);
  border-radius: 10px;
  box-shadow: 0 12px 28px -14px rgb(43 38 34 / 0.4);
}
.bloque_edadesNinyos > * {
  background: var(--color-surface);
}
.bloque_edadesNinyos #edades select {
  color: var(--color-ink);
  outline-color: var(--color-accent);
}
.bloque_edadesNinyos #acepta_ninos .botonNinyo {
  background-color: var(--color-accent);
  color: var(--color-surface);
}
`;
