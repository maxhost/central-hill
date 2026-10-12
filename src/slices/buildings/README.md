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
  `mock/buildings.html` design, **composed entirely from React/Tailwind components** — no
  `.mk` markup and no `dangerouslySetInnerHTML`. Since spec `docs/specs/buildings-admin-editor.md`
  (S2, `d1c2af9`) this file **only composes**: hero → grid → "For Owners" panel → figures band →
  earnings calculator. Everything except the grid comes from slice `pages` through its contract
  (golden rule 2): `getBuildingsPage(locale)` reads the `buildings` `page_content` row (no row or
  an invalid one → `defaultBuildings`, so the page always renders) and `BuildingsHero` /
  `BuildingsOwnerPanel` / `BuildingsStats` / `BuildingsCalculator` render it. **The listing's
  copy, hero image, figures and calculator media are edited in `/admin/pages/buildings`**, not in
  `/admin/buildings` (which keeps editing the cards). Blank fields render the `pages.buildings.*`
  i18n text (EN = the literals this page showed before the spec), so PT/ES/FR are now translated.
  The JSX/classes moved 1:1: the hero is still `core/ui`'s `<Hero compact align="center">` with
  the five additive props (see `core/ui/hero.tsx`), the panel `core/ui`'s `FeaturePanel` (button
  fixed to `#estimate`; a blank contact line is built from Settings, "Call {phone} · email ·
  WhatsApp …"), the band `core/ui`'s `StatBand` with per-cell `description` and columns from the
  figure count (3 → 3; 0 figures → no band), the calculator the Owners wizard
  (`OwnerEstimateForm`) inside `id="estimate"` with its 4:5 side media (photo, animated WebP,
  MP4/WebM or Lottie; none → the stock Pexels photo). Stock fallback images and their English
  `alt`s now live in `pages/schemas/buildings.ts`. Details: `src/slices/pages/README.md` →
  "Buildings content model". The route (`src/app/[locale]/buildings/page.tsx`) gets its whole
  `generateMetadata` from `pages`' `buildBuildingsMetadata(locale)` (editable `seo.*`, i18n
  fallback, canonical + hreflang as before). The grid is
  `./components/building-listing-card.tsx`'s `BuildingListingCard` inside `core/ui`'s
  `Section`/`Container` (one `Reveal`, no per-card stagger) fed from `listBuildings(locale)` —
  the locked `.pcard` design ported to Tailwind, **purpose-built for this grid**: distinct from
  `core/ui`'s `PropertyCard` (Home/Guest's smaller featured-portfolio carousel card).
  Client direction (B6): the city name is omitted from the card meta line (`street ·
  neighbourhood · N apartments`); the city/neighbourhood filter bar is hidden (its dead mock
  markup was removed; rebuild it with `core/ui`'s `ChipBar` when it is wired to the geography
  taxonomy); a building with no R2 cover yet falls back to
  `public/placeholders/building.svg` so cards never render empty. A building with **booking
  enabled** (admin toggle + an `avantio_url`) makes its whole card link out to that external
  booking URL in a new tab (`target="_blank"`) instead of the internal detail page;
  `BuildingSummary.booking = { enabled, url }` carries this.
- `/{locale}/buildings/{slug}` — detail (`ui/building-detail.tsx`): the approved
  `mock/building-detail.html` design, now **DB-driven** from `getBuildingBySlug(locale, slug)`
  (`notFound()` when unknown/unpublished): hero, gallery, the apartments-count/capacity/beds
  spec strip, the "THE BUILDING" prose block (optionally "The Neighbourhood"), the
  "Apartments in this Building" grid, building amenities, FAQ, and the Avantio "Book an
  apartment" CTA. Sparse-content
  resilient: empty gallery / amenities / FAQ and an empty unit set each omit their section
  (never an empty shell). The **"Apartments in this Building" grid is real JSX**: `core/ui`'s
  new `UnitCard` + `UnitCardGrid`, fed from `listByBuilding` (apartments contract — golden
  rule 2), ported 1:1 from the old `.mk` `.pcard`/`.ph`/`.badge`/`.pbody` (`mock.css`) +
  `.pspecs`/`.pspec`/`.check`/`.powered` (`PAGE_STYLE`, now deleted) CSS — verified by
  computed-style diff at 1440/834/390 incl. hover (lift + shadow, 1.04 image zoom, CTA
  `accent-deep`→`accent`). Not `PropertyCard` (padding/type scale differ, no zoom, text meta
  line instead of icon chips, `next/link` while these link out — see `UnitCard`'s docstring).
  Each card links to the unit's Avantio URL in a new tab, or falls back to the in-page `#book`
  anchor, which since spec `docs/specs/building-detail-admin-editor.md` (D7, S3 `897b3e1`) is the
  closing book band below (it used to be the "Booking powered by Avantio" line under the grid);
  spec chips keep their
  translated `title` and the size chip is omitted when `sizeM2` is unset; covers are
  `MediaImage` (lazy, responsive `sizes`) or `public/placeholders/apartment.svg`. The section
  shell/sec-head/powered line are inline JSX in `building-detail.tsx`, **outside** `.mk` (no
  raw wrapper needed; no scroll-reveal — the old `.reveal` was neutralised, section was static).
  One deliberate fix vs. the old render: the badge used to vanish under the zoomed image while
  the card was hovered (paint order); it now stays on top (`z-[1]`).
  The closing **"Book an apartment in this building" band is real JSX**: `core/ui`'s new
  `ActionBand` (full-bleed `bg-feature` band; eyebrow + serif `<h2>` + line on the left, accent
  button + small note on the right, wrapping to two rows when narrow), replacing the old
  `bookband` string in `bodyHtml()` and its `.mk .bookband*` rules in `PAGE_STYLE`. Ported 1:1
  from that CSS + `mock.css`'s `.wrap`/`.eyebrow`/`h2`/`.btn.btn-accent` (identical to
  `mock/building-detail.html`; no drift found) and verified computed-style- and
  screenshot-identical at 1440/834/390, button hover included. Not `FeaturePanel` (bordered,
  stacked, `<h3>`), `FeatureCtaBand` (photo split) or `CalloutBand` (light, rounded); the button
  is `buttonClassName("primary")` on a plain `<a>` (ADR 0035). Rendered on
  every building, **outside** `.mk`, after the still-raw amenities/FAQ `.mk` wrapper (order
  unchanged), wrapped in `<div id="book" className="scroll-mt-[84px]">` — **the band is the
  `#book` anchor** (D7). Its button opens the building's Avantio URL in a new tab; when the
  building has no Avantio URL the band renders **without CTA and note** (`ActionBand`'s `cta` is
  optional since S3 — additive kernel change authorised by the spec; the note talks about Avantio),
  so there is no self-referencing `href="#book"`. Static (the old `.reveal` was neutralised).
  Labels: existing `buildings.book*` keys.
  The **hero is real JSX**: `core/ui`'s `<Hero compact>`, the fourth consumer (after Home,
  Owners, and this slice's own listing hero) — needed two more additive props, `breadcrumb`
  (the Home / Buildings / building-name trail, a caller-built `<Link>` nav, same "kernel owns
  layout, caller owns content" split as `actions`/`aside`) and `eyebrowBadge` (the inline
  "★ New" flag before the eyebrow's neighbourhood/city text — a different, non-pill look from
  `eyebrowPill`). The street address reuses `subtitle`/`subtitleClassName` (no new prop); it
  also passes its own `headlineClassName` (`max-w-[15ch]`, normal wrap) rather than taking
  `compact`'s default, since that default is Owners' own page-specific nowrap override, not
  the mock's generic `.hero.compact h1` rule — see `hero.tsx`'s docstring. Background is the
  real R2 cover via `@core/media`'s `MediaImage` (the first DB-driven Hero `background` in the
  app — everyone else so far is a fixed literal), falling back to
  `public/placeholders/building.svg` when the building has no cover yet.
  The **spec strip (apartments/capacity/beds/neighbourhood) is real JSX** too: `core/ui`'s new
  `SpecStrip`, adapted from the old `.mk`-scoped `.specstrip`/`.spec`/`.spec .n`/`.spec .l`
  CSS — a plain, static bottom-bordered value/label row, deliberately **not** `StatBand` (no
  title, no dark band, no `CountUp` — one of its values is a neighbourhood *name*, not a
  number, see that component's docstring). It renders **outside** `.mk` (required —
  `mock.css`'s `.mk * {margin:0;padding:0}` reset is un-layered CSS, which always beats a
  layered Tailwind utility regardless of specificity, so a `.mk`-nested instance silently loses
  its own padding/margin; see `SpecStrip`'s docstring for the full explanation). Client
  direction deliberately drops the mock's own top rhythm here (`margin-top:46px` + top
  `border` + the wrapping section's own top padding) — the strip sits flush under the
  hero/gallery, bottom-bordered only.
  The **photo gallery** above the spec strip **is real JSX** too: `core/ui`'s new
  `MosaicGallery` (borderless 4px-rounded grid, `2fr 1fr 1fr` × two `1fr` rows, 10px gap, the
  first photo a two-row lead tile; 2 columns with a full-width lead at ≤680px), replacing the
  old `galleryGridHtml()` string, its dedicated `.mk` wrapper and the `.mk .gallery*` rules in
  `PAGE_STYLE` (identical to `mock/building-detail.html`; no CSS drift). Not `StepGallery`
  (numbered, captioned photo cards inside a full section). Photos are built here by
  `galleryImage()` — `MediaImage` with the lead's/cells' responsive `sizes`, or a plain `<img>`
  for a dimensionless asset — and `MosaicGallery` only places/crops them. Omitted when the
  building has no gallery photos. Verified with 8 photos on `bairro-alto-view`: every cell rect,
  the grid tracks, SpecStrip and the next section are identical at 1440/834/390 (screenshots
  pixel-identical), and a gallery-less building (`big-chiado-terrace`) is unchanged.
  **Escalated deviation:** the lead photo used to be `loading="eager"` (no `fetchpriority`);
  `MediaImage` can only express `priority` (eager + `fetchpriority=high` + a preload competing
  with the hero cover), so it is now lazy like the rest — restoring it needs an additive
  `loading` prop on `core/media`'s `MediaImage` (kernel, ADR). **Pre-existing, kept as-is:** only
  two grid rows are explicit, so a 6th+ photo creates implicit `auto` rows (photo 6 lands in the
  wide 2fr column, the row as tall as its aspect ratio); and the `sizes` hints assume the
  mock's 1184px `.wrap`, while the live `Container` is 1200px wide (and the 2fr cells of those
  extra rows get the 291px hint while rendering 590px wide).
  The **"THE BUILDING" block is real JSX** too: `core/ui`'s new `ProseSection` (eyebrow +
  serif `<h2>` + free-prose `<p>` paragraphs, with an optional "The Neighbourhood" `<h3>`
  subsection), replacing the old `.mk`-scoped `buildingSection` HTML string built by
  `bodyHtml()`. `detail.descriptionIntro`/`descriptionNeighbourhood` (plain DB text) are
  split into paragraph arrays by `splitParagraphs()` and passed as real `<p>` children — no
  `esc()`/`dangerouslySetInnerHTML` needed for this section anymore. Renders **outside**
  `.mk`, same requirement as the spec strip above (see `ProseSection`'s own docstring for
  the full cascade-layers reasoning). That docstring also flags a **pre-existing drift**
  between `mock/assets/site.css`'s `--section-y` (`clamp(72px,10vw,150px)`)/`--max` (1240px)
  tokens — which this component ports literally, to stay pixel-identical to the live page —
  and `core/ui`'s own canonical `Section`/`Container` values (`clamp(64px,10vw,160px)` /
  `max-w-7xl`); not reconciled here (golden rule 6: escalate, don't decide unilaterally).
  Checked live against the DB: "Bairro Alto View" (`bairro-alto-view`) currently has only
  `description_intro` populated, no `description_neighbourhood` row, so the subsection is
  currently never rendered for this building — `ProseSection`'s optional-subsection path was
  verified separately (DOM-injected real mock copy against the live compiled CSS, screenshot
  + computed-style checked), not against DB content, since none is populated yet.

Both are ISR (`revalidate = 3600`); detail uses `generateStaticParams` (known slugs
prebuilt, `dynamicParams = true`) + `generateMetadata` with hreflang alternates. A building
publish busts the listing via `revalidateBuildingList` (tag `building-list` + the localized
`/buildings` paths).

### Icons on `core/ui` `<Icon>` (ADR 0034)

The detail page's amenity grid renders each amenity's own `icon` (an Iconoir name, now
validated by the strict `iconKey` in `amenityInput`; `check-circle` when unset). The 8 seeded
amenities were backfilled (`wifi`, `air-conditioner`, `elevator`, `cutlery`, `washing-machine`,
`tv`, `key`, `city`). The apartment-card spec chips use fixed Iconoir names: `house-rooms`
(bedrooms), `bed`, `user` (guests) and `maximize` (size). No route of this slice imports
`mock.css` anymore.

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
The listing's editable sections are busted by slice `pages`, not here: Save on
`/admin/pages/buildings` → `revalidatePage("buildings")` (tag `page:buildings` + `/{locale}/buildings`
×4). The detail pages read nothing from that row.

## Backoffice (`admin/`) — buildings CRUD (S12)

Plugs into the backoffice shell. The slice contributes one `content`-group screen
(`admin/screens.ts` → `buildingsAdminScreens`, re-exported from `contract.ts`) and mounts
list/create/edit routes under `app/(admin)/admin/(panel)/buildings/…`. Since spec
`docs/specs/building-detail-admin-editor.md` (S1–S3) **apartments are managed inside their
building** (the apartments slice has no menu entry of its own — see its README):

```
/admin/buildings                                list (Apartments column: published / total)
/admin/buildings/new                            building form, no workspace (variant "new")
/admin/buildings/[id]                           WORKSPACE layout → "Building" tab (the form)
/admin/buildings/[id]/apartments                "Apartments (N)" tab — apartments slice list
/admin/buildings/[id]/apartments/new|[aptId]    apartment form, building fixed (apartments slice)
```

- **Building workspace** (`app/…/buildings/[id]/layout.tsx`, S1): a shared header around every
  nested route — "← Buildings", the building name, its status badge, "View on site ↗" (only when
  published; opens the source-locale `/en/buildings/<slug>`) and the **Building / Apartments (N)**
  tabs. Unknown building → 404. Built from `getBuildingWorkspace(id)` →
  `{ id, name, status, publicPath }` (source `en` name, slug fallback) plus
  `admin/ui/workspace-header.tsx`'s `BuildingWorkspaceHeader` (server) and
  `admin/ui/workspace-tabs.tsx`'s `BuildingWorkspaceTabs` (client island for the active state only:
  "Building" on the exact `/admin/buildings/[id]`, "Apartments" on `/apartments` and below). The
  tab count `N` arrives as the `apartmentsCount` prop: **the route composes it** from the
  apartments slice (`countApartmentsByBuilding`) — this slice never reads apartments.
- **List column "Apartments"** shows `published / total` (tooltip `apartmentsCountTitle`) and links
  to the workspace's Apartments tab. `BuildingsAdminList({ apartmentCounts })` receives the
  `buildingId → { total, published }` map from the route (`app/…/buildings/page.tsx`), again
  composed from the apartments slice; a building absent from the map shows `0 / 0`.
- `admin/queries.ts` (server-only, not cache-wrapped — admin is dynamic): `listBuildingsAdmin`
  (all statuses), `getBuildingForEdit` (full **source-locale** record + resolved media previews),
  `getBuildingWorkspace` (workspace header), `listAmenitiesAdmin` (taxonomy for the multi-select),
  `listLocationOptions` (city/neighbourhood).
- `admin/validation.ts` — `buildingSaveInput`: the editor's post shape (nullable optionals,
  `min(1)` on required [T] text, gallery/amenities/FAQ relations). All coercion in one place.
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — `saveBuilding` (create/update) and
  `deleteBuilding`. Source [T] content + per-locale slugs persist through the **`core/i18n` write
  seam** (ADR 0019); the building-owned relations (gallery / amenities / FAQ) are written here.
  Slugs are written across all four locales for reachability (localized slugs are a later
  refinement). FAQ rows are upserted **by id** so approved translations survive an edit; removed
  rows have their polymorphic translation rows cleaned up. On success `revalidateBuilding` busts
  the ISR caches.
- `admin/ui/` — `list.tsx` (server), `workspace-header.tsx` / `workspace-tabs.tsx` (above) +
  `building-form.tsx` (one client island for new + edit), using the backoffice form + media picker
  primitives (`MediaField` / `MediaGalleryField`). `BuildingForm` takes a **`variant`**:
  `"new"` (`/admin/buildings/new`) keeps its own header and "← back"; `"workspace"` (the Building
  tab) drops them because the workspace layout already shows them. Saving a new building still
  lands on `/admin/buildings/[id]`.
- **Form order = the public detail page** (S3). Only the order, the cards (`AdminCard`) and the
  help texts changed — no field was added or removed. Ten cards:
  1. **Status & visibility** — status, position, `is_featured` ("Listing only."), `is_new`
     ("Shows the ★ New flag on the hero and the listing card.").
  2. **Hero** — name, slug (`slugPublicHint`: "…Changing it changes the public URL."), city,
     neighbourhood, address, cover ("Hero background and card photo. Landscape 16:9, at least
     2400×1350 px.").
  3. **Gallery** — "Mosaic under the hero. Landscape 4:3, at least 1600×1200 px. The first photo is
     the large tile."
  4. **The Building** — headline (still required, no hint), `description_intro` ("One paragraph per
     line."), `description_neighbourhood` ("… Leave blank to hide “The Neighbourhood”.").
  5. **Amenities** — "Create or rename amenities in Amenities." (links to `/admin/amenities`).
  6. **FAQ** — "Leave empty to hide the FAQ section."
  7. **Booking** — `avantio_id`, `avantio_url` ("Book band button, and fallback for apartments
     without their own link."), `booking_enabled` ("Listing card links straight to Avantio instead
     of this page.").
  8. **Listing card** — teaser ("Shown on the /buildings card and as the SEO description
     fallback.").
  9. **Map location** — latitude, longitude ("Not shown on the site yet.").
  10. **SEO** — meta title/description, OG image ("1200×630 px. Leave blank to use the cover.").

  Section titles are `buildings.admin.sections.*`, card-level hints `buildings.admin.sectionHints.*`,
  field hints `buildings.admin.fields.*Hint` (4 locales). The old `identity` / `location` / `media` /
  `descriptions` section keys were removed.

### Amenity taxonomy editor (`/admin/amenities`)

A second `content`-group screen (`buildings.amenities`, nav key `backoffice.nav.amenities`),
mirroring the service-category editor: list at `/admin/amenities`, create at `/new`, edit +
delete at `/[id]` (routes under `app/(admin)/admin/(panel)/amenities/…`).

- Reads: `listAmenitiesForAdminTable` (label, slug, icon, group, how many buildings list it) and
  `getAmenityForEdit` (source `en` label).
- Validation: `amenitySaveInput` = the public `amenityInput` extended to the form's post shape
  (`id?`, nullable `icon` — still the strict `iconKey` when set —, nullable `group`, `min(1)`
  label). `admin/ui/amenity-payload.ts` maps the form controls to it (blank ⇒ `null`).
- Actions: `saveAmenity` (refuses a duplicate slug with `slug_conflict`, since the column has no
  unique index; the [T] `label` goes through the write seam) and `deleteAmenity`
  (`building_amenity` rows cascade; the polymorphic translations are cleaned). Both call
  `revalidateBuildingList()`: every public building read carries `BUILDING_TAGS.list`, so this
  refreshes the amenity grid on every building page.
- UI: `amenity-list.tsx` (server) + `amenity-form.tsx` (client; `IconField` with `allowEmpty` —
  a blank icon renders `check-circle` on the building page). Delete asks with the same
  `window.confirm` as the category form, naming how many buildings will lose the amenity.

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
