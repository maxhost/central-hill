# Slice `geography` (S1)

Catalog taxonomy — **cities** and their **neighbourhoods**. A backing taxonomy with **no public
routes of its own**: it produces typed refs + cache tags consumed by other slices. See
`docs/vertical-slices.md` → S1, `docs/data-model.md` → Slice geography.

## Owns

**Tables** (`schema.ts`, migration `0000`): `city`, `neighbourhood`. `city` carries
`slug, position, status, country, hero_media_id`; `neighbourhood` carries `city_id, slug, position`
(no status — a neighbourhood is public iff its city is published). Translatable (**[T]**) fields —
city `name`/`intro`, neighbourhood `name` — live in the `translation` table (`core/i18n`), not as
columns. Neighbourhood *descriptive prose* is authored per building (`building.description_neighbourhood`,
slice S2), not here.

## Contract (`contract.ts`)

Types: `CityRef` (id, slug, name, country, intro, hero), `NeighbourhoodRef` (id, cityId, slug, name).
Reads: `listCities(locale)`, `getCityBySlug(locale, slug)`, `listNeighbourhoods(locale, cityId?)`,
`getNeighbourhoodBySlug(locale, slug)`, `listCityParams()`.
Staff reads: `listLocationNameOptions()` (published cities/neighbourhoods for Buildings),
`listGuideCityOptions()` (all city statuses for Guides). Both retain stable IDs and EN
`name`, with approved/fallback `labels` for EN/ES/PT/FR.
Cache tags: `GEO_TAGS.list` = `city-list`, `GEO_TAGS.city(id)` = `city:<id>`.

All reads are `unstable_cache`-wrapped (keyed by locale) and tagged so a publish busts them.

### Consumers must subscribe to `GEO_TAGS.list`

Geography content (city/neighbourhood names, hero) gets **embedded** in downstream cached reads
(buildings cards, guide heroes, page teasers). Those slices should add `GEO_TAGS.list` to the
`tags` of any `unstable_cache` read that embeds geography content, so a geography publish busts
them too — this is the contract-level cross-slice invalidation channel (golden rule 2).

## Routes

**None.** Geography renders no public pages. It is consumed by:
- **S2 buildings** — `city_id` / `neighbourhood_id` filters + card labels.
- **S6 guides** — city scope (`getCityBySlug`, `listCityParams` for `generateStaticParams`).
- **S9 pages** — location teasers.

## i18n

Public content has no UI chrome → content translations resolve through `core/i18n` with the
source-locale (`en`) fallback + `approved`-only gating for target locales (docs/seo-i18n.md).
Per-locale public slugs live in the `slug` table. The **backoffice** screens add a `geography`
namespace (`geography.admin.*`) authored for en/pt/es/fr.

## Revalidation (`server/publish.ts`)

`revalidateGeography()` / `revalidateCity(id)` — the single place that busts geography ISR caches
on publish. No paths to revalidate (no own routes); cascades to consumers via `GEO_TAGS.list` +
the sitemap tag. Called by the geography admin actions once the backoffice shell (S12) lands.

## Backoffice (`admin/`) — city editor with inline neighbourhoods (S12)

Plugs into the backoffice shell. Contributes one `website`-group screen ("Cities",
`admin/screens.ts` → `geographyAdminScreens`, order 16), nested beneath Buildings after
Amenities; the city list + editor mount under
`app/(admin)/admin/(panel)/cities/…`. A city is edited together with its neighbourhoods.

- `admin/validation.ts` — `citySaveInput` (city slug/status/country/hero + [T] name/intro,
  plus a `neighbourhoods` array; each `id?`, slug, `min(1)` name).
- `admin/queries.ts` (server-only) — `listCitiesAdmin` (every status, source names,
  neighbourhood counts) and `getCityForEdit` (source values + raw target names including
  pending rows, with absent inputs blank, and hero preview). Not cache-wrapped.
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — `saveCity` saves city and
  ordered neighbourhoods together. One ficha has four names per entity; manual targets
  become approved, blank targets clear only that name for English fallback, and omitted
  targets preserve old clients. Updates retain previous per-locale URLs unless the shared
  slug actually changes; creates and real shared-slug edits write four identical slugs.
  Unchanged EN intro is not written; actual intro edits preserve independent target intros,
  including when EN is cleared (ADR0069). Neighbourhoods upsert by owned city/id and
  success returns their IDs in input order so freshly added rows survive repeat Saves.
  Removed rows are purged. Existing sequential persistence remains, without new atomicity
  guarantees. Save invalidates geography tags and admin Building/Guide consumers.
  `deleteCity` purges city + neighbourhoods + their translations/slugs.
- `admin/ui/` — `list.tsx` (server) and `city-form.tsx` (client island; hero media picker +
  inline neighbourhood rows).

## Sitemap (deferred)

If cities ever get standalone pages, **S13** enumerates them from `listCityParams()` / the
contract. Today guides (S6) own the city-scoped public URLs.

## Tests

`tests/geography.test.ts` — city/neighbourhood input validation + the translatable-path contract.
`tests/geography-admin.test.ts` — the admin `citySaveInput` schema. Run:
`npx tsx --test src/slices/geography/tests/geography.test.ts src/slices/geography/tests/geography-admin.test.ts`.

`tests/geography-name-locales.test.ts` covers raw target extraction and payload guards.
`tests/geography-name-locales.integration.test.ts` exercises guarded synthetic DB actions,
approval/fallback/public labels, custom/missing slug preservation, intro row preservation,
foreign neighbourhood ownership, creation and repeated-save identities. Test-only Node
loaders stub auth/cache outside requests; independent Next browser QA verifies actual
staff authorization and invalidation. No schema change or city intro translation inputs.

### Geography name-input backend verification — 2026-11-07

Writer branch `geography-name-locales/backend`, base `b4f2d37`. Safe environment
sourced from `/private/tmp/central-hill-building-status-qa/env.sh`; DB tests first
assert URL host `propertylocalesqa.local` and SQL database/role `propertylocalesqa`.
Only new `e820` city/neighbourhood fixtures (and their returned fresh child IDs)
were written, then removed in the `after` hook. Existing `e821` browser fixtures
and all prior content were untouched. No schema, migration, media write or server.

Checks: `pnpm typecheck` exit 0; explicit ESLint over the seven assigned TypeScript
files exit 0; `git diff --check` exit 0. The following actual test command exited 0
with 26 passes (4 new pure, 7 new DB, 15 existing Geography groups):

```sh
source /private/tmp/central-hill-building-status-qa/env.sh
export NODE_OPTIONS="$NODE_OPTIONS --require /private/tmp/central-hill-property-forms-qa/node-runtime.cjs"
pnpm exec tsx --import /private/tmp/central-hill-geography-name-locales-qa/backend/test-runtime.mjs --test src/slices/geography/tests/geography-name-locales.test.ts src/slices/geography/tests/geography-name-locales.integration.test.ts src/slices/geography/tests/geography.test.ts src/slices/geography/tests/geography-admin.test.ts
```

Evidence: `/private/tmp/central-hill-geography-name-locales-qa/backend/` contains
`tests-final.log`, `typecheck-final.log`, `lint-final.log` and the external test-only
loader. An initial 9/10 run exposed a test helper misuse of `loadAllSlugs(type)`
(the API returns every entity); filtering by owned entity corrected the assertion.
It required no product change and its cleanup completed. Integrated build, actual
Next cache/authorization and browser persistence remain the orchestrator/QA steps.

### City image descriptions (ADR0076)

The hero picker has four ALT inputs without new tabs. Optional hero_alts goes through
the existing City Save and stores image_alt:<mediaUUID> on the City translation owner;
blank targets use EN, then existing asset/name fallback. Replacing a photo starts
its own descriptions and preserves old rows. The CityRef hero reader follows locale;
this does not add a City hero to public views that currently do not render it.
