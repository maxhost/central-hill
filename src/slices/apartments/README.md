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

- `ui/building-apartments.tsx` → `BuildingApartments({ locale, slug })` — the full
  "Apartments in this Building" section (eyebrow + grid + Avantio note). Self-contained:
  resolves the building via the buildings contract, lists its units, renders nothing when
  unpublished or empty.
- `ui/components/apartment-card.tsx` → `ApartmentCard` — cover + badge + name + the
  "Bedrooms · Up to Guests · Beds" spec line; links to the unit's own Avantio deep-link, else
  the building booking section.

### Integration note (S2)

`BuildingApartments`/`ApartmentCard` (above) are the **Tailwind** rendering of the grid, kept
for any consumer that wants the design-system look. The live building-detail page
(`buildings/ui/building-detail.tsx`) instead renders the units inline in the locked **`.mk`
mock** `.pcard` markup — the rest of that page is the approved `mock/building-detail.html`
design, so a Tailwind island would clash and (unlike the mock card) shows no placeholder. The
buildings slice consumes only this slice's **contract** (`listByBuilding` + `ApartmentSummary`),
never its internals — same pattern as the listing keeping the mock card over the Tailwind
`BuildingCard`.

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

## Backoffice (`admin/`) — apartments CRUD (S12)

Plugs into the backoffice shell. Contributes one `content`-group screen
(`admin/screens.ts` → `apartmentsAdminScreens`, re-exported from `contract.ts`); list/create/edit
mount under `app/(admin)/admin/(panel)/apartments/…`.

- `admin/queries.ts` (server-only) — `listApartmentsAdmin` (all statuses; building names via the
  **buildings contract**, never its table), `getApartmentForEdit` (source-locale record + media
  previews).
- `admin/validation.ts` — `apartmentSaveInput`, **simplified to the building-card fields** (client
  direction: units surface only inside their building's grid, no standalone unit page): building,
  `name` [T], `badge` [T], bedrooms / max_guests / beds_count, an optional cover (placeholder when
  absent) and optional Avantio handles. The slug, bathrooms, size, floor, gallery, long
  description, OG image and SEO meta are no longer authored — their DB columns stay nullable
  (dropping them would be a destructive migration → ADR).
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — `saveApartment` / `deleteApartment`.
  The per-locale slug is **auto-generated from the name** (a unit has no public URL — the slug is an
  internal identity key only; on collision it is suffixed with the new id's short hash, and on edit
  it stays put). Source [T] content (`name`, `badge`) + slugs via the `core/i18n` write seam
  (ADR 0019). After any change to the published set, **building stats are recomputed** (and the old
  building's too on a reassignment) and caches busted via `revalidateApartment`.
- `admin/ui/` — `list.tsx` (server) + `apartment-form.tsx` (one client island for new + edit).

**Stat recompute (escalation resolved):** `server/stats.ts` `recomputeBuildingStats(buildingId)`
aggregates the published units over **our** table and persists via the buildings-contract
`setBuildingStats` — buildings can't read the apartment table (golden rule 2). This closes the
escalation previously noted above / in `server/publish.ts`.

## Deferred / escalations

- **Richer JSON-LD** (`Apartment` / `LodgingBusiness`): belongs in `core/seo` (**S13**, ADR —
  golden rule 3), not hand-written here.

## Tests

`tests/apartments.test.ts` — apartment / media input validation + the translatable-path
contract. `tests/apartments-admin.test.ts` — the `apartmentSaveInput` admin schema. Run:
`npx tsx --test src/slices/apartments/tests/apartments.test.ts src/slices/apartments/tests/apartments-admin.test.ts`.
