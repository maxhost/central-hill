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
  `dangerouslySetInnerHTML` content renders anymore (the only `BODY` string left is the
  hidden, commented-out filter bar, kept for later DB wiring; the `.mk`/`PAGE_STYLE`/
  `<ScrollReveal>` scaffold stays only for that dormant markup). The hero is `core/ui`'s
  `<Hero compact align="center">`,
  single-column (no `aside`), ported 1:1 from the old `.mk`-scoped overrides (now deleted) via
  five additive `Hero` props (`align`/`overlayClassName`/`headlineClassName`/
  `subtitleClassName`/`wrapClassName` — see `core/ui/hero.tsx`'s docstring); this page has no
  `page_content` row, so every hero string/image is still a fixed literal. The grid is
  `./components/building-listing-card.tsx`'s `BuildingListingCard` inside `core/ui`'s
  `Section`/`Container` (one `Reveal`, no per-card stagger) fed from `listBuildings(locale)` —
  the locked `.pcard` design ported to Tailwind, **purpose-built for this grid**: distinct from
  both `core/ui`'s `PropertyCard` (Home/Guest's smaller featured-portfolio carousel card) and
  this slice's own `building-card.tsx` (`BuildingCard` — dead code, no real consumer, a third
  different-again look; left as-is rather than deleted, since it wasn't this task's target).
  Client direction (B6): the city name is omitted from the card meta line (`street ·
  neighbourhood · N apartments`); the city/neighbourhood filter bar is hidden (kept commented
  out in source for later DB wiring); a building with no R2 cover yet falls back to
  `public/placeholders/building.svg` so cards never render empty. A building with **booking
  enabled** (admin toggle + an `avantio_url`) makes its whole card link out to that external
  booking URL in a new tab (`target="_blank"`) instead of the internal detail page;
  `BuildingSummary.booking = { enabled, url }` carries this. The "For Owners" band is
  `core/ui`'s new `FeaturePanel` (a single bordered, solid dark "feature band" panel — no
  image, unlike `DualCtaPanels`/`FeatureCtaBand`, see that component's docstring for why it's
  a separate primitive), ported 1:1 from the old `.dual`/`.dcol.owner`/`.contact-line` CSS
  (shared `mock.css` rules, untouched — other `.mk`-embedded pages may still use them); no
  schema field backs it, every string is still a fixed literal. "Numbers That Speak for
  Themselves" is the same `core/ui` `StatBand` Owners/Home use (ported 1:1 from the old
  `.stats`/`.stats-grid`/`.stat .lbl` CSS), extended with two additive props: `columns={3}`
  (this page's grid, vs. the default 4) and each cell's `description` (a second line under the
  label); the figures themselves are still the same fixed literals as before this port. The
  "Discover your property's earning potential" earnings calculator is the exact Owners hero
  wizard — `@slices/pages/contract`'s `OwnerEstimateForm` (now a cross-slice-reusable export;
  see that component's + the contract's docstrings for why only step 1's copy is a prop while
  steps 2/3 stay fixed) + `EstFormStepper`/`EstFormWizard`, two columns (form/photo, photo
  first when stacked). Image is still a fixed Pexels placeholder (no schema field).
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
  anchor (the "Booking powered by Avantio" line under the grid); spec chips keep their
  translated `title` and the size chip is omitted when `sizeM2` is unset; covers are
  `MediaImage` (lazy, responsive `sizes`) or `public/placeholders/apartment.svg`. The section
  shell/sec-head/powered line are inline JSX in `building-detail.tsx`, **outside** `.mk` (no
  raw wrapper needed; no scroll-reveal — the old `.reveal` was neutralised, section was static).
  One deliberate fix vs. the old render: the badge used to vanish under the zoomed image while
  the card was hovered (paint order); it now stays on top (`z-[1]`). The apartments slice's
  Tailwind `BuildingApartments`/`ApartmentCard` are a different look, kept for other consumers
  (same rationale as `BuildingCard` on the listing).
  The closing **"Book an apartment in this building" band is real JSX**: `core/ui`'s new
  `ActionBand` (full-bleed `bg-feature` band; eyebrow + serif `<h2>` + line on the left, accent
  button + small note on the right, wrapping to two rows when narrow), replacing the old
  `bookband` string in `bodyHtml()` and its `.mk .bookband*` rules in `PAGE_STYLE`. Ported 1:1
  from that CSS + `mock.css`'s `.wrap`/`.eyebrow`/`h2`/`.btn.btn-accent` (identical to
  `mock/building-detail.html`; no drift found) and verified computed-style- and
  screenshot-identical at 1440/834/390, button hover included. Not `FeaturePanel` (bordered,
  stacked, `<h3>`), `FeatureCtaBand` (photo split) or `CalloutBand` (light, rounded); the button
  is a literal `.btn.btn-accent` port, not `ButtonLink` (whose `primary` differs in radius,
  padding, border, tracking and uses `next/link`) — see `ActionBand`'s docstring. Rendered on
  every building, **outside** `.mk`, after the still-raw amenities/FAQ `.mk` wrapper (order
  unchanged); links to the building's Avantio URL in a new tab, else the in-page `#book`
  anchor; static (the old `.reveal` was neutralised). Labels: existing `buildings.book*` keys.
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
  hero/gallery, bottom-bordered only. The gallery next to it is still raw markup (not yet
  migrated), given its own tiny dedicated `.mk` wrapper so `.gallery`'s CSS keeps resolving
  without reintroducing the reset to the rest of the band.
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
