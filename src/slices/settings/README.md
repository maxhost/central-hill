# Slice `settings` / `globals` (S11)

The **site-wide singleton + navigation**. Owns the company globals (contact, social,
headline stats, office, currency, default OG image, Avantio account config) and the
header/footer navigation trees. Renders the **app-shell chrome** (sticky header +
footer) on every public page. See `docs/vertical-slices.md` → S11,
`docs/data-model.md` → Slice settings / globals.

## Owns

**Tables** (`schema.ts`, migration `0000`):
- `company_settings` — singleton. Scalars/jsonb stored inline: `email, phone, whatsapp,
  social{}, stats{key:{value,label}}, office_address, office_hours, currency,
  default_og_image_media_id, avantio_account_id, avantio_widget_config{},
  show_building_location, show_building_count` (the last two are the Lisbon-only Buildings
  display toggles, client feedback B6, migration `0002`), `checkin_phone, website_url` (the
  About office panel's check-in phone and company website, nullable, migration `0018`, spec
  `docs/specs/about-admin-editor.md` S3 — see below). [T]: each `stats.<key>.label`
  and `office_hours_label`.
- `nav_item` — `location ('header'|'footer'), parent_id (self-ref → sub-nav / footer
  columns), position, url`. [T]: `label`.

`default_og_image_media_id` is a loose uuid → `media_asset` (core/media), resolved via
that kernel module, never by querying its table.

## Contract (`contract.ts`)

Types: `SiteGlobals`, `CompanyStat`, `StatKey`, `SocialLinks`, `NavLink`, `NavLocation`.
Reads: `getGlobals(locale)` (singleton, `null` when unconfigured),
`getNav(locale, location)` (header/footer tree, top-level items with `children`).
Cache tags: `SETTINGS_TAGS.globals` = `globals`, `SETTINGS_TAGS.nav` = `nav`.

**Check-in phone and website (spec about-admin-editor S3, migration `0018`).**
`SiteGlobals.checkinPhone` / `SiteGlobals.website` (`string | null`) read `company_settings.checkin_phone`
/ `website_url`, trimmed; blank → `null`. Consumer: the About office panel (`pages`
`ui/about-office.ts`), which **hides the row when the value is null** (also when no settings row
exists — the pre-seed `DEFAULT_GLOBALS` fallback is not used there). `website` is an absolute
`https://` URL (About shows it without the scheme). `DEFAULT_GLOBALS` carries the current values
(`+351 912 310 632`, `https://www.centralhill.pt`).
- `drizzle/0018_settings_checkin_website.sql`: two `ADD COLUMN IF NOT EXISTS … text` + an `UPDATE`
  seeding the values the page showed, with `COALESCE` (re-runnable, never overwrites a value).
  Additive. **Applied in PROD on 2026-10-16** (before the push, owner OK).
- **Cache key `GLOBALS_SHAPE`** (`server/queries.ts`, today `"v2"`) is part of `getGlobals`'
  `unstable_cache` key, next to the site-icon list (`SITE_ICONS_SHAPE`). Bump it whenever
  `SiteGlobals` gains a field, so an entry cached before the field existed is never served.

Both reads are `unstable_cache`-wrapped (keyed by locale) and tagged so a publish busts
them. **Consumers that embed globals/nav in their own cached reads (e.g. S9 pages:
stats, default OG image) should add `SETTINGS_TAGS.globals` to those reads' tags** so a
settings publish cascades.

**Booking links (client feedback B2)** — `avantioBookingUrl(locale)`, `AVANTIO_LOCALES`,
`AVANTIO_OWNERS_LOGIN_URL` (pure, from `booking.ts`; safe in server + client). Every
"search / book" CTA points at the Avantio rentals engine for the active locale, falling
back to English for locales Avantio does not support (pt/en/es/fr only). Consumers: the guest
page's dual-CTA panel and the header **Book Now** CTA. (Home's dual-CTA band was removed in
ADR 0031, which also retired the `pages.dualCta.*` chrome.)

**Avantio search bar** — `AvantioSearchBar({ locale })`, a server component that renders the
vendor's external "barra de pesquisa" widget (doc: `docs/Widget Externo Avantio.pdf`, account
`bk_centralhill`). Consumer: S9 Home, directly below the hero.

`server/avantio-widget.ts` fetches the localized form and `includeJs.php` on the server
(`revalidate: 86400`, so the public page never blocks on Avantio) and normalises them for a
Next app on a different origin: the root-relative form `action` is absolutised (the root path
404s — only Avantio's language segment resolves: `es→alquiler`, `en→rentals`, `fr→location`,
`pt→aluguer`), every `<script>` is extracted so the island can replay it (markup assigned via
`innerHTML` leaves scripts inert), the vendor's `document.write` branches plus an `alert()` debug
timer are dropped, and the `<link rel="stylesheet">` riding inside the fragment is stripped and
returned as data (`widget.stylesheets`) instead of being injected at mount. Returns `null` when
Avantio is unreachable, so an outage degrades to a missing section instead of a failed build.

`ui/components/avantio-search-bar.tsx` renders the `avantio-integration` meta, then all three
vendor stylesheets in a fixed order (`flexible-search` → `formulario-style` → `fontlibrary`),
then `AVANTIO_STYLE`. React 19 hoists the `<link>`s into `<head>` while a plain `<style>` stays
in the body, so the app layout stays untouched and our overrides are last in document order.
`avantio-search-bar-client.tsx` owns the load order: `CRS_DOMAIN` → markup → jQuery 3.4.1 →
fetched scripts in document order → optional framework bundle.

### The override layer (`ui/components/avantio-styles.ts`)

`AVANTIO_STYLE` restyles the widget to Warm Editorial and floats it on the hero / stats-band
seam. Spec: `docs/specs/avantio-search-widget-restyle.md`.

- **It wins on document order, not on `!important`.** Its selectors deliberately mirror Avantio's
  chained ids (`#miniformulario_slider #sombrap #tabla_form …`) rather than being written shorter:
  matching the vendor's specificity is enough once the `<style>` ships after the `<link>`s. The
  only `!important` declarations answer `!important` in the vendor sheets (the range datepicker's
  green pill and its `Open Sans` pin).
- **Three vendor brand colours, not one.** `#1b5d63` (button, children-ages confirm, focus ring)
  and `#dc3776` (single-month datepicker, autocomplete) both live in `formulario-style.css`;
  `#3BDC8D` with its `#C8F5DF` wash lives in `flexible-search.css` and paints the **two-month
  range** datepicker this account actually opens. Missing the third leaves a green calendar.
- **Some selectors are unscoped on purpose.** `#ui-datepicker-div`, `.ui-autocomplete` and
  `.bloque_edadesNinyos` are appended to the body root by the vendor's jQuery, so they cannot be
  nested under `#miniformulario_slider`. The `<style>` only exists on pages rendering the widget.
- **Under 550px the button is put back in normal flow.** The vendor makes that cell
  `position: sticky; bottom: 0`, which pins it to the viewport rather than the card, so it rides
  up over the fields until the card's bottom scrolls into view. Overridden to `static`.
- **The seam offset lives here too**, next to the measured card height it is derived from: one
  `--avantio-overlap` custom property drives equal negative margins top and bottom above 880px,
  so the section takes no net space in the flow; below 880px the fields stack and it reverts to a
  normal band.

Changing the *set* of fields (Dates / Zone / Adults / Children) is **not possible from our side** —
see the open Avantio request in §11 of the restyle spec.

The vendor's `its--scripts.js` is **deliberately off** (`LOAD_FRAMEWORK_BUNDLE = false`): it
throws `jQuery.cookie is not a function`, and supplying that plugin makes it write a 360-day
`acepta_cookie` consent cookie with no prompt. The search bar does not need it. Full rationale
and the browser-verified checks: `docs/specs/avantio-search-widget.md`.

## Header chrome — top-right cluster + sub-tabs (client feedback B1)

`ui/site-header.tsx` is laid out in **three sections**: (1) the brand logo; (2) the **menu** —
the primary nav links plus a ghost **Book Now** CTA (→ `avantioBookingUrl`) set off at the end;
(3) a top-right **utilities** cluster — an **owner-login / account** icon
(→ `AVANTIO_OWNERS_LOGIN_URL`), a **contact** icon (`ui/components/contact-dialog.tsx`,
`variant="icon"` — a client modal embedding the leads `ContactForm`, `kind="contact"`; staff
email goes to `LEAD_NOTIFY_TO`; exported through the contract and reused as the Owners hero CTA,
`source="owners-hero"`, and as the owner button of the Guests closing dual CTA,
`source="guests-dual-cta"` with `title`/`intro` from the guest page and the additive
`triggerClassName` prop — it replaces the `variant` trigger classes, e.g. with `core/ui`'s
`splitCtaButtonClassName("dark")`; omitted → unchanged), and the **language dropdown** (`ui/components/locale-switcher.tsx`
— globe + current locale + chevron; opens a menu of the four locales, selected + hover highlighted
with the hero accent; a `tone` adapts it to the dark footer). Over a page hero the ghost CTA shows
a white hairline that fills white on hover (chrome rule in `globals.css`, keyed by
`data-cta="ghost"`); scrolled / no-hero pages keep the dark default. Top-level nav items with
`children` reveal their **sub-tabs on hover/focus** as a
**full-width frosted bar directly under the header** (pure CSS `group-hover`/`group-focus-within`,
no JS; mirrors the `mock/` owner sub-nav); the bar is `data-chrome-keep` so its ink links stay
readable over a hero. The fallback menu ships Guests → Services / What to Do so the mechanism is
visible before the back office seeds nav. The mobile drawer mirrors all of the above.
Owners / Real Estate / About sub-tabs are hardcoded section-anchor lists (not DB nav). The Real
Estate list lives in `ui/subnav-sections.ts` (`{ key, href }`) and its labels are i18n keys
`settings.subnav.realEstate.<key>` in all 4 locales (real-estate spec S6); Owners and About labels
are still EN-only.

## App-shell chrome (cross-cut)

This slice ships the header/footer as slice-owned server components
(`ui/site-header.tsx`, `ui/site-footer.tsx`) and **composes them into the app shell**
`src/app/[locale]/layout.tsx` (the layout renders `<SiteHeader/>`, the page, then
`<SiteFooter/>`). This is the one edit outside the slice dir — the app shell's explicit
job is composition (CLAUDE.md → repo shape), analogous to slices adding their own app
routes. No other shared file changed.

### Pre-seed fallback

Until the backoffice (S12) writes a `company_settings` row / `nav_item` rows, the
chrome still renders correctly:
- **Globals** fall back to `DEFAULT_GLOBALS` (`defaults.ts`) — Central Hill's real,
  locale-neutral contact/figures from the `mock/` reference.
- **Navigation** falls back to a **localized** default menu built in the header/footer
  from i18n (`settings.nav.*` / `settings.footer.*`) — so the fallback respects all 4
  locales. DB rows win the moment they exist.

## i18n

UI chrome → `settings` namespace in `messages/{en,pt,es,fr}.json` (all 4 authored):
nav labels, CTAs, footer column titles/links, copyright (`{year}`), language switcher.
DB content ([T] fields: stat labels, office-hours label, nav labels) resolves through
`core/i18n` with the source-locale (`en`) fallback + `approved`-only gating.

## Revalidation (`server/publish.ts`)

`revalidateGlobals()` / `revalidateNav()` — the single place that busts the `globals` /
`nav` tags and revalidates each locale's layout tree (the chrome is in the root
layout). Called by the settings admin actions (S12).

## Backoffice (`admin/`) — globals singleton + navigation builder (S12)

Plugs into the backoffice shell. Contributes two **admin-only** `system`-group editors
(`admin/screens.ts` → `settingsAdminScreens`): "Settings" (globals, order 10) and
"Navigation" (order 20); they mount under `app/(admin)/admin/(panel)/{settings,navigation}/…`
(both gated with `requireStaff(["admin"])`).

- `admin/validation.ts` — `companySettingsSaveInput` (contact, social URLs, the six stats,
  office, currency, default OG, Avantio account + widget-config object; since spec
  about-admin-editor S3 `checkin_phone` — same rule as `phone`, 3–40 chars — and `website_url` —
  `httpsUrl` from `validation.ts`, ≤300 — both nullable, `null` = blank) and
  `navigationSaveInput` (header/footer trees, each item with one level of children).
- `admin/queries.ts` (server-only) — `getGlobalsForEdit` (the singleton, **scaffolded from
  `DEFAULT_GLOBALS` when no row exists**, source [T] labels resolved) and
  `getNavigationForEdit` (the two trees). Not cache-wrapped.
- `admin/actions.ts` (`"use server"`, **admin-only**) — `saveGlobals` (singleton upsert:
  scalars/jsonb as columns; the [T] stat labels + office-hours label via the `core/i18n`
  write seam, ADR 0019; `revalidateGlobals`) and `saveNavigation` (nav items upserted **by
  id** preserving label translations, removed ones purged; `revalidateNav`).
- `admin/ui/` — `globals-form` (Avantio config edited as JSON; "Check-in phone" and "Website"
  fields next to phone / WhatsApp, hints `settings.admin.globals.fields.checkinPhoneHint` /
  `websiteHint` in 4 locales: "Leave blank to hide the row") and `nav-form` (header/footer
  builder with add/remove/reorder + sub-items).

## Deferred

- **Transparent-over-hero nav**: the `mock/` prototype has a scrim/transparency that
  reacts to scroll per page; the shell ships a clean solid sticky header. A
  page-scoped transparent variant can layer on later.
- **Default OG image / Organization JSON-LD**: `getGlobals().defaultOgImage` and
  contact details feed `core/seo` builders owned by **S13** (Organization/LocalBusiness
  JSON-LD).
- **Stats on Home/Owners**: `getGlobals().stats` is consumed by **S9 pages**.

## Tests

`tests/settings.test.ts` — company-settings / nav-item input validation (incl. the optional
check-in phone and https website, S3) + the translatable-path contract.
`tests/settings-admin.test.ts` — the admin save schemas (globals + navigation trees; check-in
phone and website: valid, `null` or rejected). Run:
`npx tsx --test src/slices/settings/tests/settings.test.ts src/slices/settings/tests/settings-admin.test.ts`.
