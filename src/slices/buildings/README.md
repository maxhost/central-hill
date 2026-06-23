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
  avantio_url?, booking_enabled` (migration `0011`: when on + an `avantio_url` is set, the
  listing card links out to that external URL in a new tab instead of the detail page)
  + denormalized stats `apartments_count, total_capacity, beds_count`
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

- `/{locale}/buildings` — listing (`ui/buildings-listing.tsx`): the approved
  `mock/buildings.html` design (hero + owner CTA + stats + earnings calculator chrome,
  static `.mk` markup) with a **DB-driven** card grid generated from `listBuildings(locale)`
  into the locked `.pcard` markup. Client direction (B6): the city name is omitted from the
  card meta line (`street · neighbourhood · N apartments`); the city/neighbourhood filter bar
  is hidden (kept commented out in source for later DB wiring); a building with no R2 cover
  yet falls back to `public/placeholders/building.svg` so cards never render empty. The
  Tailwind `BuildingCard`/`BuildingFilter` components are a different look, kept for other
  consumers. A building with **booking enabled** (admin toggle + an `avantio_url`) makes its
  whole card link out to that external booking URL in a new tab (`target="_blank"`) instead of
  the internal detail page; `BuildingSummary.booking = { enabled, url }` carries this.
- `/{locale}/buildings/{slug}` — detail (`ui/building-detail.tsx`): the approved
  `mock/building-detail.html` design, now **DB-driven** from `getBuildingBySlug(locale, slug)`
  (`notFound()` when unknown/unpublished): hero (placeholder cover when no R2 image), gallery,
  the apartments-count/capacity/beds spec strip, "The Building" / "The Neighbourhood" prose,
  the "Apartments in this Building" grid, building amenities, FAQ, and the Avantio
  "Book an apartment" CTA. Sparse-content resilient: empty gallery / amenities / FAQ and an
  empty unit set each omit their section (never an empty shell). The unit grid is rendered as
  the locked `.mk .pcard` markup from `listByBuilding` (apartments contract — golden rule 2),
  with `public/placeholders/apartment.svg` when a unit has no cover; the apartments slice's
  Tailwind `BuildingApartments`/`ApartmentCard` are a different look, kept for other consumers
  (same rationale as `BuildingCard` on the listing).

Both are ISR (`revalidate = 3600`); detail uses `generateStaticParams` (known slugs
prebuilt, `dynamicParams = true`) + `generateMetadata` with hreflang alternates. A building
publish busts the listing via `revalidateBuildingList` (tag `building-list` + the localized
`/buildings` paths).

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

## Backoffice (`admin/`) — buildings CRUD (S12)

Plugs into the backoffice shell. The slice contributes one `content`-group screen
(`admin/screens.ts` → `buildingsAdminScreens`, re-exported from `contract.ts`) and mounts
list/create/edit routes under `app/(admin)/admin/(panel)/buildings/…`.

- `admin/queries.ts` (server-only, not cache-wrapped — admin is dynamic): `listBuildingsAdmin`
  (all statuses), `getBuildingForEdit` (full **source-locale** record + resolved media previews),
  `listAmenitiesAdmin` (taxonomy for the multi-select), `listLocationOptions` (city/neighbourhood).
- `admin/validation.ts` — `buildingSaveInput`: the editor's post shape (nullable optionals,
  `min(1)` on required [T] text, gallery/amenities/FAQ relations). All coercion in one place.
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — `saveBuilding` (create/update) and
  `deleteBuilding`. Source [T] content + per-locale slugs persist through the **`core/i18n` write
  seam** (ADR 0019); the building-owned relations (gallery / amenities / FAQ) are written here.
  Slugs are written across all four locales for reachability (localized slugs are a later
  refinement). FAQ rows are upserted **by id** so approved translations survive an edit; removed
  rows have their polymorphic translation rows cleaned up. On success `revalidateBuilding` busts
  the ISR caches.
- `admin/ui/` — `list.tsx` (server) + `building-form.tsx` (one client island for new + edit),
  using the backoffice form + media picker primitives (`MediaField` / `MediaGalleryField`).

`contract.ts` also exports `setBuildingStats(buildingId, stats)` — the write fn the **apartments**
admin calls to persist recomputed `apartments_count / total_capacity / beds_count` (buildings
can't read the apartment table — golden rule 2).

## Deferred (not in this slice's first cut)

- **Stat recomputation**: `apartments_count / total_capacity / beds_count` are recomputed
  on **apartment publish** — owned by **S3 apartments**, which computes the aggregate over its own
  table and calls the buildings-contract `setBuildingStats` + `revalidateBuilding`.
- **Richer JSON-LD** (`LodgingBusiness` / `Apartment` / `Place` with geo): needs a new
  kernel `core/seo` builder → **ADR required** (golden rule 3). Escalated, not hand-written.
- **Sitemap entries**: **S13** enumerates building URLs from `listBuildingParams()`.
- **Map embed** (`latitude`/`longitude` are stored and exposed) → a future map component.

## Tests

`tests/buildings.test.ts` — building/amenity/FAQ input validation + the translatable-path
contract. `tests/buildings-admin.test.ts` — the `buildingSaveInput` admin schema (required [T],
kebab slug, cover required, FAQ row rules). Run:
`npx tsx --test src/slices/buildings/tests/buildings.test.ts src/slices/buildings/tests/buildings-admin.test.ts`.
