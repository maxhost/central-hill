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
  display toggles, client feedback B6, migration `0002`). [T]: each `stats.<key>.label`
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

Both reads are `unstable_cache`-wrapped (keyed by locale) and tagged so a publish busts
them. **Consumers that embed globals/nav in their own cached reads (e.g. S9 pages:
stats, default OG image) should add `SETTINGS_TAGS.globals` to those reads' tags** so a
settings publish cascades.

**Booking links (client feedback B2)** — `avantioBookingUrl(locale)`, `AVANTIO_LOCALES`,
`AVANTIO_OWNERS_LOGIN_URL` (pure, from `booking.ts`; safe in server + client). Every
"search / book" CTA points at the Avantio rentals engine for the active locale, falling
back to English for locales Avantio does not support (pt/en/es/fr only). Consumers:
home/guest `dualCta.guestCta` and the header **Book Now** CTA.

## Header chrome — top-right cluster + sub-tabs (client feedback B1)

`ui/site-header.tsx` is laid out in **three sections**: (1) the brand logo; (2) the **menu** —
the primary nav links plus a ghost **Book Now** CTA (→ `avantioBookingUrl`) set off at the end;
(3) a top-right **utilities** cluster — an **owner-login / account** icon
(→ `AVANTIO_OWNERS_LOGIN_URL`), a **contact** icon (`ui/components/contact-dialog.tsx`,
`variant="icon"` — a client modal embedding the leads `ContactForm`, `kind="contact"`; staff
email goes to `LEAD_NOTIFY_TO`), and the **language dropdown** (`ui/components/locale-switcher.tsx`
— globe + current locale + chevron; opens a menu of the four locales, selected + hover highlighted
with the hero accent; a `tone` adapts it to the dark footer). Over a page hero the ghost CTA shows
a white hairline that fills white on hover (chrome rule in `globals.css`, keyed by
`data-cta="ghost"`); scrolled / no-hero pages keep the dark default. Top-level nav items with
`children` reveal their **sub-tabs on hover/focus** as a
**full-width frosted bar directly under the header** (pure CSS `group-hover`/`group-focus-within`,
no JS; mirrors the `mock/` owner sub-nav); the bar is `data-chrome-keep` so its ink links stay
readable over a hero. The fallback menu ships Guests → Services / What to Do so the mechanism is
visible before the back office seeds nav. The mobile drawer mirrors all of the above.

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
  office, currency, default OG, Avantio account + widget-config object) and
  `navigationSaveInput` (header/footer trees, each item with one level of children).
- `admin/queries.ts` (server-only) — `getGlobalsForEdit` (the singleton, **scaffolded from
  `DEFAULT_GLOBALS` when no row exists**, source [T] labels resolved) and
  `getNavigationForEdit` (the two trees). Not cache-wrapped.
- `admin/actions.ts` (`"use server"`, **admin-only**) — `saveGlobals` (singleton upsert:
  scalars/jsonb as columns; the [T] stat labels + office-hours label via the `core/i18n`
  write seam, ADR 0019; `revalidateGlobals`) and `saveNavigation` (nav items upserted **by
  id** preserving label translations, removed ones purged; `revalidateNav`).
- `admin/ui/` — `globals-form` (Avantio config edited as JSON) and `nav-form` (header/footer
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

`tests/settings.test.ts` — company-settings / nav-item input validation + the
translatable-path contract. `tests/settings-admin.test.ts` — the admin save schemas
(globals + navigation trees). Run:
`npx tsx --test src/slices/settings/tests/settings.test.ts src/slices/settings/tests/settings-admin.test.ts`.
