# Slice `buildings` (S2)

The catalog's **core entity** — a Lisbon building with a gallery, building-level
amenities & FAQ, denormalized apartment stats, and a location resolved through the
geography slice. Renders the public **buildings listing** and each **building detail**
page (ISR). See `docs/vertical-slices.md` → S2, `docs/data-model.md` → Slice buildings,
`docs/content-briefs.md` → 2 · Buildings.

## Owns

**Tables** (`schema.ts`, migration `0000`):
- `building` — `slug, status, position, is_new, is_featured, city_id, neighbourhood_id,
  street_address, latitude?, longitude?, cover_media_id, og_image_media_id?, avantio_id?,
  avantio_url?` + denormalized stats `apartments_count, total_capacity, beds_count`
  (recomputed by this slice on **apartment publish**, S3). [T]: `name, headline, teaser`
  (~180 chars), `description_intro`, `description_neighbourhood`, `meta_title`, `meta_description`.
- `building_media` — ordered gallery (`building_id, media_id, position`).
- `amenity` — amenity taxonomy (`slug, icon, group?`); [T] `label`.
- `building_amenity` — M:N building ↔ amenity.
- `building_faq` — per-building FAQ (`building_id, position`); [T] `question, answer`.

`city_id` / `neighbourhood_id` are loose uuids (no Drizzle FK) → they point at
**geography**-owned tables; cross-slice references are resolved through that slice's
contract, never by querying its tables (golden rule 2).

## Contract (`contract.ts`)

Types: `BuildingSummary`, `BuildingDetail`, `BuildingLocation`, `AmenityRef`,
`BuildingFaqItem`, `BuildingStats`, `BuildingFilter`.
Reads: `listBuildings(locale, filter?)`, `getBuildingBySlug(locale, slug)`,
`getFeaturedBuildings(locale, limit=3)`, `listBuildingParams()`.
`BuildingFilter` = `{ cityId?, neighbourhoodId?, isNew?, isFeatured? }` (server-side SQL).
Cache tags: `BUILDING_TAGS.list` = `building-list`, `BUILDING_TAGS.building(id)` = `building:<id>`.

All reads are `unstable_cache`-wrapped (keyed by locale + filter) and tagged so a publish
busts them.

### Consumes geography (subscribes to `GEO_TAGS.list`)

City/neighbourhood **names** come from the geography contract (`listCities`,
`listNeighbourhoods`). Because that content is embedded in our cached reads, every
building read also carries **`GEO_TAGS.list`** in its tags — a geography publish busts
building caches too (the contract-level cross-slice invalidation channel; geography
README → "Consumers must subscribe to `GEO_TAGS.list`").

## Routes

- `/{locale}/buildings` — listing: hero + client-side city/neighbourhood filter + card grid.
- `/{locale}/buildings/{slug}` — detail: hero + stats + gallery + "The Building" /
  "The Neighbourhood" prose + amenities + FAQ + Avantio "Book an apartment" CTA.

Both are ISR (`revalidate = 3600`); detail uses `generateStaticParams` (known slugs
prebuilt, `dynamicParams = true`) + `generateMetadata` with hreflang alternates.

## i18n

UI chrome → `buildings` namespace in `messages/{en,pt,es,fr}.json` (all 4 authored).
DB content ([T] fields) resolves through `core/i18n` with the source-locale (`en`)
fallback + `approved`-only gating. Per-locale public slugs live in the `slug` table.

## SEO / structured data

`generateMetadata` (canonical + hreflang + OG). JSON-LD: **BreadcrumbList** only for now
(kernel `core/seo` helper). A richer `LodgingBusiness`/`Apartment` builder is a **kernel
change** → see Deferred.

## Revalidation (`server/publish.ts`)

`revalidateBuildingList()` / `revalidateBuilding(id, slugByLocale)` — the single place
that busts building ISR caches + localized paths on publish. Called by the building admin
actions (S12) and by the apartments slice (S3) when it recomputes a building's stats.

## Deferred (not in this slice's first cut)

- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12** — building/amenity/FAQ
  forms, gallery ordering, translation review. Not buildable before S12.
- **Stat recomputation**: `apartments_count / total_capacity / beds_count` are recomputed
  on **apartment publish** — owned by **S3 apartments**, which calls `revalidateBuilding`.
- **Richer JSON-LD** (`LodgingBusiness` / `Apartment` / `Place` with geo): needs a new
  kernel `core/seo` builder → **ADR required** (golden rule 3). Escalated, not hand-written.
- **Sitemap entries**: **S13** enumerates building URLs from `listBuildingParams()`.
- **Map embed** (`latitude`/`longitude` are stored and exposed) → a future map component.

## Tests

`tests/buildings.test.ts` — building/amenity/FAQ input validation + the translatable-path
contract. Run: `npx tsx --test src/slices/buildings/tests/buildings.test.ts`.
