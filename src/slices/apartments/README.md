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

### Integration handoff (S2 / S9)

This slice ships `BuildingApartments` **ready to compose** but does **not** edit the
buildings-owned detail component or its app route (golden rule 1). To render the grid, the
building-detail composition should add, after the gallery:

```tsx
import { BuildingApartments } from "@slices/apartments/ui/building-apartments";
// …
<BuildingApartments locale={locale} slug={slug} />
```

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

## Deferred / escalations

- **Stat recompute**: `building.apartments_count / total_capacity / beds_count` are recomputed
  on apartment publish (data-model.md). The UPDATE writes a **buildings-owned** table, so it
  cannot live in this slice (golden rules 1 & 4). It needs a buildings-contract write function
  invoked by the **S12** admin publish action; until that contract change lands,
  `revalidateApartment` only invalidates caches.
- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12**.
- **Richer JSON-LD** (`Apartment` / `LodgingBusiness`): belongs in `core/seo` (**S13**, ADR —
  golden rule 3), not hand-written here.

## Tests

`tests/apartments.test.ts` — apartment / media input validation + the translatable-path
contract. Run: `npx tsx --test src/slices/apartments/tests/apartments.test.ts`.
