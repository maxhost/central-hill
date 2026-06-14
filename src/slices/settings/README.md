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
  default_og_image_media_id, avantio_account_id, avantio_widget_config{}`. [T]: each
  `stats.<key>.label` and `office_hours_label`.
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

## Deferred (not in this slice's first cut)

- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12** — settings form,
  nav builder (drag-order, parent/child), translation review. Not buildable before S12.
- **Transparent-over-hero nav**: the `mock/` prototype has a scrim/transparency that
  reacts to scroll per page; the shell ships a clean solid sticky header. A
  page-scoped transparent variant can layer on later.
- **Default OG image / Organization JSON-LD**: `getGlobals().defaultOgImage` and
  contact details feed `core/seo` builders owned by **S13** (Organization/LocalBusiness
  JSON-LD).
- **Stats on Home/Owners**: `getGlobals().stats` is consumed by **S9 pages**.

## Tests

`tests/settings.test.ts` — company-settings / nav-item input validation + the
translatable-path contract. Run:
`npx tsx --test src/slices/settings/tests/settings.test.ts`.
