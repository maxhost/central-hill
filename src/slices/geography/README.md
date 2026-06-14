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

No UI chrome of its own → no `messages/` namespace. Content translations resolve through
`core/i18n` with the source-locale (`en`) fallback + `approved`-only gating for target locales
(docs/seo-i18n.md). Per-locale public slugs live in the `slug` table.

## Revalidation (`server/publish.ts`)

`revalidateGeography()` / `revalidateCity(id)` — the single place that busts geography ISR caches
on publish. No paths to revalidate (no own routes); cascades to consumers via `GEO_TAGS.list` +
the sitemap tag. Called by the geography admin actions once the backoffice shell (S12) lands.

## Deferred (not in this slice's first cut)

- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12** — list/form + translation
  review. Not buildable before S12.
- **Sitemap entries**: if cities ever get standalone pages, **S13** enumerates them from
  `listCityParams()` / the contract. Today guides (S6) own the city-scoped public URLs.

## Tests

`tests/geography.test.ts` — city/neighbourhood input validation + the translatable-path contract.
Run: `npx tsx --test src/slices/geography/tests/geography.test.ts`.
