# Slice `apartments` (S3)

The **bookable unit** — a single apartment inside a building, linked to the **Avantio**
booking engine. Amenities & FAQ live on the **building** (S2), not here. This slice has
**no public route of its own**: the public UX books a unit through its building's Avantio
engine, and the units render as the "Apartments in this Building" grid inside the building
detail page. See `docs/vertical-slices.md` → S3, `docs/data-model.md` → Slice apartments.

## Owns

**Tables** (`schema.ts`, migration `0000`):
- `apartment` — `slug, status, position, building_id→building, badge?, bedrooms, bathrooms,
  max_guests, beds_count, size_m2?, floor?, cover_media_id?, og_image_media_id?, avantio_id?,
  avantio_url?`. [T]: `name, badge, description, meta_title, meta_description`.
- `apartment_media` — `apartment_id→apartment (cascade), media_id, position` (gallery).

`building_id` references the buildings-owned `building` table (cross-slice ref to an *owned*
table, golden rule 4). All building data is read through `@slices/buildings/contract`.

## Contract (`contract.ts`)

Types: `ApartmentSummary`, `ApartmentDetail`, `ApartmentBooking`.
Reads:
- `listByBuilding(locale, buildingId)` — published units of a building in `position` order
  (the building-detail grid). `[]` when none.
- `getApartmentBySlug(locale, slug)` — a single unit with gallery + [T] description + SEO +
  hreflang alternates; `null` when unknown/unpublished. No route consumes it yet — it exists
  for S9 / S13 (SEO, alternates) and a possible future unit microsite.

Cache tags: `APARTMENT_TAGS.list` = `apartment-list`, `APARTMENT_TAGS.apartment(id)` =
`apartment:<id>`. Both reads are `unstable_cache`-wrapped (keyed by locale + building/slug).

## UI

This slice ships **no public UI**. The "Apartments in this Building" grid is rendered by the
buildings slice (`buildings/ui/building-detail.tsx`) with `core/ui`'s `UnitCard`/`UnitCardGrid`,
consuming only this slice's **contract** (`listByBuilding` + `ApartmentSummary`) and its
`apartments` i18n namespace. (The former Tailwind `BuildingApartments`/`ApartmentCard` had no
consumer and were removed on 2026-10-07.)

## i18n

UI-chrome strings live in the root `messages/<locale>.json` under the `apartments` namespace
(authored for en/pt/es/fr): eyebrow, title, intro, the `bedrooms`/`guests`/`beds` ICU plurals
(`bedrooms` renders "Studio" at `=0`), checkAvailability, poweredBy. The `name`/`badge`/
`description`/`meta_*` [T] DB fields resolve through `core/i18n` (source-`en` fallback +
`approved`-only gating).

## Revalidation (`server/publish.ts`)

`revalidateApartment(apartmentId, buildingId)` — the single place that busts apartment caches
on publish. Busts `apartment:<id>` + `apartment-list`, and the parent building's
`building:<id>` + `building-list` (its denormalized stats change with the unit set), using the
tag constants the buildings slice exports on its **contract**.

## Backoffice (`admin/`) — apartments CRUD (S12), nested in the building

Since spec `docs/specs/building-detail-admin-editor.md` (S1 `2b779d0`, S2 `a20114a`) apartments
are **managed only inside their building** (owner decision D4). `admin/screens.ts` →
`apartmentsAdminScreens` (still re-exported from `contract.ts`) is **`[]` on purpose**: no menu
entry of its own, kept so the panel layout's composition does not change; "Buildings" stays
highlighted on every nested route. The routes live in the buildings workspace
(`app/(admin)/admin/(panel)/buildings/[id]/…`, whose layout/header/tabs belong to the buildings
slice) and render this slice's screens:

| Route | Renders |
|---|---|
| `/admin/buildings/[id]/apartments` | `ApartmentsAdminList({ buildingId, buildingStatus })` — the "Apartments (N)" tab |
| `/admin/buildings/[id]/apartments/new` | `ApartmentForm({ buildingId })` — building fixed by the URL |
| `/admin/buildings/[id]/apartments/[aptId]` | `ApartmentForm` — **404** when the apartment does not exist or belongs to another building |

**Legacy routes redirect** (kept so links/bookmarks don't break): `/admin/apartments` and
`/admin/apartments/new` → `/admin/buildings`; `/admin/apartments/[id]` →
`/admin/buildings/{building_id}/apartments/[id]` (404 when the apartment does not exist).

Composition without crossing internals: the routes call both slices and pass data by prop —
`buildingStatus` comes from the buildings slice's `getBuildingWorkspace`, and this slice's
`countApartmentsByBuilding` feeds the buildings list column and the workspace tab count. Building
names in the list still come from the **buildings contract** (`listBuildingOptions`), never its
table.

- `admin/queries.ts` (server-only) —
  - `listApartmentsAdmin({ buildingId? })` — all statuses, ordered by building, `position`, then
    `id`; `buildingId` narrows it to one building (without it, every apartment). Each row also
    carries `buildingId`, `position`, `badge`, `bedsCount`, `sizeM2`, `hasAvantioUrl` and `cover`
    (media preview or null).
  - `countApartmentsByBuilding()` — `Map<buildingId, { total, published }>` (`total` = every
    status) from one `GROUP BY building_id, status`; buildings without apartments are absent.
  - `getApartmentForEdit` (source-locale record + media previews).
- `admin/derive.ts` — pure helpers (no DB client, no `server-only`, so they run under `tsx --test`):
  `apartmentListWhere(buildingId?)` (the list filter), `tallyApartmentCounts(rows)` (GROUP BY rows →
  counts map), `nextApartmentPosition(positions)` (`max + 1`, 0 when empty),
  `sortApartmentSlots` (`position`, then `id`), `planApartmentMove(slots, id, "up" | "down")` (swap
  with the neighbour, renumber the building to `0..n-1`, return only the changed rows; `null` at
  either end) and `isBuildingChange(stored, posted)` (the D6 guard).
- `admin/validation.ts` — `apartmentSaveInput`, **simplified to the building-card fields** (client
  direction: units surface only inside their building's grid, no standalone unit page): building,
  `name` [T], `badge` [T], bedrooms / max_guests / beds_count, an optional cover (placeholder when
  absent) and optional Avantio handles. `position` is now **optional and ignored** by the save
  (additive). The slug, bathrooms, size, floor, gallery, long description, OG image and SEO meta
  are no longer authored — their DB columns stay nullable (dropping them would be a destructive
  migration → ADR).
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) —
  - `saveApartment` — the per-locale slug is **auto-generated from the name** (a unit has no public
    URL — the slug is an internal identity key only; on collision it is suffixed with the new id's
    short hash, and on edit it stays put). Source [T] content (`name`, `badge`) + slugs via the
    `core/i18n` write seam (ADR 0019). **On create** the unit goes last in its building
    (`position = max + 1`). **On update** a `building_id` other than the stored one is rejected
    (`validation`, field `building_id`, i18n `errors.buildingChange`) — **D6: an apartment never
    moves to another building**, so only that building's stats are recomputed.
  - `deleteApartment` — recomputes the building's stats.
  - `moveApartment(id, "up" | "down")` — ↑ / ↓ in the Apartments tab: swaps with the neighbour
    **in the same building** (display order: `position`, then `id`), renumbers the building to
    `0..n-1` (heals duplicate/gapped positions) and writes the changed rows in one Neon batch; a
    no-op at either end.
  - All three bust the public caches via `revalidateApartment` and the admin views via
    `revalidatePath("/admin/buildings")` + `revalidatePath("/admin/buildings/[id]", "layout")`
    (list column, tab count and every nested page) — no longer `/admin/apartments`.
- `admin/ui/` —
  - `list.tsx` (server) — the building's list: Order (↑ / ↓ via `move-buttons.tsx`, disabled at the
    ends), Photo (cover thumbnail or a grey "No photo" box), Name (link to the form + badge),
    Status, Specs (`2 bd · 3 beds · 4 guests · 65 m²`, size omitted when unset), Avantio ("Own
    booking link" / "— uses building's"). Empty → `EmptyState` with "+ New apartment". When the
    building is **published and none of its apartments is**, a warning says the *Apartments in this
    Building* section stays hidden until one is published.
  - `apartment-form.tsx` (one client island for new + edit) — no building selector and no position
    field (the building comes from `buildingId`); header "← Apartments" back to the tab. Saving a new
    unit lands on `/admin/buildings/[id]/apartments/{new id}`; deleting goes back to the tab. Help
    texts: cover ("Card photo, 4:3, at least 1200×900 px. Leave blank for the placeholder."), badge
    ("Short label on the card (e.g. Terrace). Leave blank for none."), Avantio URL ("Leave blank to
    use the building's booking link.").

**Stat recompute (escalation resolved):** `server/stats.ts` `recomputeBuildingStats(buildingId)`
aggregates the published units over **our** table and persists via the buildings-contract
`setBuildingStats` — buildings can't read the apartment table (golden rule 2). This closes the
escalation previously noted above / in `server/publish.ts`.

## Deferred / escalations

- **Richer JSON-LD** (`Apartment` / `LodgingBusiness`): belongs in `core/seo` (**S13**, ADR —
  golden rule 3), not hand-written here.

## Tests

`tests/apartments.test.ts` — apartment / media input validation + the translatable-path
contract. `tests/apartments-admin.test.ts` — the `apartmentSaveInput` admin schema.
`tests/apartments-admin-derive.test.ts` — the `admin/derive.ts` helpers: building filter and
per-building counts, position on create, `planApartmentMove` (same-building neighbour, both ends,
renumbering) and the D6 guard. Run:
`npx tsx --test src/slices/apartments/tests/apartments.test.ts src/slices/apartments/tests/apartments-admin.test.ts src/slices/apartments/tests/apartments-admin-derive.test.ts`.
