# Slice `guides` (S6)

Image descriptions are edited beside hero/social, section and place pickers in
each language tab. Optional `GuideContent.media_alts` stores localized descriptions
by media UUID in the existing draft/publication JSON. Image identities remain
shared; ALT follows the existing inherit/custom and explicit per-language Publish
lifecycle. Detail, index and recommendations resolve the selected publication's
ALT first, then the existing asset/title/name fallback for blanks (ADR0076).

The **"What to Do"** city guides — a public **index + guide-page detail** built on a
`guide_page → guide_section → guide_place` tree, scoped to a city. Fully extensible:
add cities, pages, sections and places at will (content brief 4.2; Lisbon first, Porto
later). See `docs/vertical-slices.md` → S6, `docs/data-model.md` → Slice guides.

## Owns

**Tables** (`schema.ts`, migration `0000`):
- `guide_page` — `city_id→city (geography), template (landing|eat|beaches|events|secrets|
  families|groups|travellers|custom), slug, status, position, hero_media_id?,
  og_image_media_id?`. [T]: `title, intro, meta_title, meta_description`.
- `guide_section` — `guide_page_id→guide_page (cascade), position, layout
  (standard|with_cta|with_media|featured_places), header_media_id?, cta_url?, presentation?`.
  [T]: `title, body, local_tip, cta_label`.
- `guide_place` — `guide_section_id→guide_section (cascade), position, category?, address?,
  phone?, price_tier? (budget|mid|premium = €/€€/€€€), opening_hours?, latitude?,
  longitude?, website_url?, booking_url?, media_id?`. [T]: `name, description`.

`*_media_id` are loose uuids → `media_asset` (core/media), resolved through that kernel
module, never by querying its table.

**City data is read only through the geography contract** (`listCities`, `getCityBySlug`,
`CITY`, `GEO_TAGS`) — this slice never queries geography's tables (golden rule 2).

## Routes (App Router, ISR)

- `/[locale]/guides` — index (`ui/guides-listing.tsx`, fully JSX — no `.mk` block left):
  hero (`core/ui` `Hero`), the "Choose your city" bar (`core/ui` `ChipBar`; presentational
  only, no real city filter yet), one section per city with a grid of its published guide
  pages (`listGuideCityGroups` → `GuideCard`), the **Top Recommendations** grid
  (`listTopRecommendations` → `RecommendationCard`; the whole section is hidden when the
  query returns nothing), and the closing `CenteredCtaBand`. `revalidate = 3600` +
  tag-revalidated. Icons are `core/ui` `<Icon>` (inline Iconoir SVG, ADR 0034); no `mock.css`.
- `/[locale]/guides/[city]/[slug]` — guide-page detail (`ui/guide-page.tsx`, the approved
  `mock/guide-detail.html` on the service-detail skeleton): `core/ui` `DetailTitle`
  (Home / Guides / city, meta = template icon + "N areas" · pin + "N places"),
  `MosaicGallery adaptive` (hero + section images, deduplicated, max 5), `DetailLayout` with
  one `ContentBlock` per section (anchor from `sectionAnchorIds`, eyebrow "01"…: prose,
  16:9 image, "Local tip" `Callout`, places grid of `RecommendationCard` in place mode,
  optional CTA) beside a `StickyAside` (`TocList` + the `pages` contract's accommodation
  `AsideCta`; on mobile a collapsible `TocList` sits above the sections), then "More
  {city} guides" (`GuideCard`, max 3, current excluded) on the `alt` band.
  `RecommendationCard` serves both the index (`rec`, links to the guide) and the detail
  (`place`, an `<article>` with a phone · "Directions →" footer).
  `generateStaticParams` from `listGuideParams()`; `dynamicParams = true`. The `[city]`
  segment is verified against the page's `city_id` (a mismatched city → `notFound`).

## Content

The 8 real Lisbon guide pages (`things-to-do-in-lisbon`, `where-and-what-to-eat-in-lisbon`,
`beaches-near-lisbon`, `events-and-festivals-in-lisbon`, `secrets-of-lisbon`,
`lisbon-for-families-and-kids`, `lisbon-for-groups-and-friends`, `information-for-travellers`
— one per `GuideTemplate`) are written by `scripts/seed-guides.ts`, adapted from the live
centralhill.pt "What to do in Lisbon" pages. It is **not a migration**: idempotent,
re-runnable, and writes through the same seams (`core/i18n` source content + slugs,
`core/media` R2 ingest) the admin uses. This is now a historical bootstrap: do not re-run it after
human CMS edits without a separate preservation review, because it rebuilds child IDs
and can replace seed-owned assets. Source locale (`en`) only; `pt`/`es`/`fr` fall back to it until
translated (same accepted gap as `scripts/seed-services.ts`).

  pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/seed-guides.ts

**Place images + categories.** Every `eat` place has a `category` (Tasca, Restaurant,
Fine Dining, Brunch, Vegan, …) and a photo; the 9 beach places are `category: "Beach"` with
an address and a photo ("who it suits" moved into the description); the 4 viewpoints in
*Top Things to Do* have photos (no address in the source, so they are not recommendation
candidates). Photos are Pexels originals, each checked visually, ingested through the real
media pipeline like the section/hero images. Sections and places are rebuilt on every run
(new ids), but their images go through a per-page **reuse pool keyed by `media_asset.credit`**:
an unchanged photo is re-attached, never re-uploaded; a photo the seed drops is deleted;
assets a person uploaded (other credit) are never reused or deleted. A no-change re-run
prints `0 uploaded`.

R2 note: if your `.env.local` `R2_S3_ENDPOINT` ends in `/<bucket>`, override it for the run
with the bucket-less URL (`R2_S3_ENDPOINT=… pnpm tsx --env-file=.env.local …` — Node's
`--env-file` never overrides an already-set variable), or uploads land under a
`<bucket>/` key prefix and 404 publicly.

## Contract (`contract.ts`)

Types: `GuidePageSummary`, `GuidePageDetail`, `GuideSection`, `GuidePlace`,
`GuideCityGroup`, `GuideCityRef`, `GuideTemplate`, `GuideLayout`, `GuidePriceTier`.
`GuideRecommendation`, `GuideRecommendationType`, `RECOMMENDATION_TYPES`.
Reads: `listGuideCityGroups(locale)`, `getGuidePage(locale, citySlug, pageSlug)`,
`listGuideParams()`, `listTopRecommendations(locale, limit = 3)`.

**Top Recommendations selection rule** (`listTopRecommendations`; no featured flag — uses
existing data): candidates are places in a published guide page of a published city that
have an image, a `category` and a non-blank `address`; the category must equal one of
`RECOMMENDATION_TYPES` = `restaurant`, `viewpoint`, `beach` (case-insensitive, trimmed).
Walking guide → section → place `position` order, the first match per type wins; output is
in that type order, and a type with no match is skipped (result may be shorter or empty).
With the seed data: Ramiro (Restaurant), Miradouro do Adamastor (Viewpoint), São João Beach
(Beach). Returns name/description/category/address/image + the guide's `{citySlug, slug}`.
Cache tags: `GUIDE_TAGS.list` = `guide-list`, `GUIDE_TAGS.page(id)` (reserved for a
future targeted bust).

All reads are `unstable_cache`-wrapped (keyed by locale, + city/slug) and tagged
`guide-list` **and** `GEO_TAGS.list` (city content is embedded), so either a guides or a
geography publish refreshes them. **S9 pages that embed a "Best of" guides teaser should
add `GUIDE_TAGS.list` to their own cached reads' tags** so a guides publish cascades.

`GuidePageDetail.alternates` carries per-locale `{city, slug}` pairs (only locales where
both slugs exist) so the detail route builds correct hreflang URLs without cross-locale
guessing.

## i18n

UI chrome → `guides` namespace in `messages/{en,pt,es,fr}.json` (all 4 authored): hero,
city bar (`chooseCity`/`cityLisbon`/`cityPorto`/`cityCascais`/`citySoon`/`cityNote`),
per-city heading, card CTA, Top Recommendations head (`recEyebrow`/`recTitle`/`recIntro`)
and type labels (`recType.restaurant|viewpoint|beach`; other categories show their raw text), breadcrumb, "local tip", place meta labels (address/hours/
phone) and outbound link labels (website/book/directions); the detail page's `home`, `breadcrumbLabel`,
`crumbGuides`, `toc`, `areaCount`/`placeCount` (ICU plurals), `moreEyebrow`, `moreTitle`,
`allCityGuides`. DB content ([T] fields)
resolves through `core/i18n` with the source-locale (`en`) fallback + `approved`-only
gating. Section `body` is plain rich text rendered as paragraphs.

## Revalidation (`server/publish.ts`)

`revalidateGuides()` — the single place that busts the `guide-list` tag (index + every
detail subscribe). Called by the guides admin actions (S12).

## Deferred (not in this slice's first cut)

- **Map embed**: places expose `latitude`/`longitude`; the UI links out to Google Maps.
  An interactive map widget is a kernel/app-shell decision (ADR), not hand-rolled here.
- **Guide/ItemList JSON-LD**: only `BreadcrumbList` is emitted; a richer
  `ItemList`/`TouristAttraction` builder belongs in `core/seo` (**S13**, ADR — golden
  rule 3).

## Tests

`tests/guides.test.ts` — page / section / place input validation + the translatable-path
contract. `tests/format.test.ts` — the detail page's pure helpers (`sectionAnchorIds`,
`sectionNumber`, `placeDirectionsUrl`, `priceTierSymbol`). Run:
`npx tsx --test src/slices/guides/tests/*.test.ts`.


## Listing editorial control

The fixed editorial content of `/{locale}/guides` is edited in Pages → Guides,
through the Pages contract (SEO, hero, filter/heading copy, icon overrides and CTA).
Individual guide/section/place content is edited in `/admin/guides`. No duplicate card/place
content is saved in page_content.

`listTopRecommendations(locale, limit, {cityIds})` optionally restricts candidates
before selecting the first complete place per type. Omitted scope is global, an
empty city list returns none; deduplicated sorted IDs enter the cache key. Existing
unscoped consumers and listGuideCityGroups/listGuideParams retain their behavior.
The city-filter setting affects only the index, preserving publication and detail URLs.

## Individual Guides CMS

`/admin/guides`, `/new`, `/[id]` are staff-gated for admin/editor. The editor authors
EN source on the existing page → section → place tree, preserving stable UUIDs,
localized slugs and target translations. Mutations are strict granular patches;
omission retains data, explicit null clears optional fields (and clearing source
text removes that field’s translations in every locale). Ordering uses complete
validated child ID lists. Published guides update live on save; there is no separate
revision draft. New incomplete sections start hidden. Archive replaces guide delete.

Migration0021 adds nullable section `presentation` JSONB with `{version:1,enabled?,
modules?:{body?,image?,local_tip?,places?,cta?}}`. Null inherits legacy composition.
Hidden values remain available to admin; public queries apply visibility before TOC,
counts and mosaic, and hidden place modules do not qualify for recommendations.
Unknown presentation versions fall back publicly and block silent admin overwrites.
`template` remains editorial category/icon; `layout` is preserved legacy data, not a
visual template selector. Public places now render optional hours, website and booking
links; HTTP(S)/phone helpers also guard legacy content. Shared aside remains Pages
and shared icons remain Settings; no local duplicate overrides.

Writes use existing i18n/media seams and sequential Neon HTTP statements. A failed
request can persist partially; results report confirmed steps and require reload
before further saves. Stable IDs make retries safe. This is not an atomic aggregate
or optimistic locking system. Every mutation validates ownership and the effective
published tree; MIME/existence checks run on server. Media queue flushes before save.

`revalidateGuides` is exported through the contract. Translation actions also invoke
it for guide_page/guide_section/guide_place, ensuring approved/reset fields refresh
`guide-list` and the outer SEO `sitemap` cache instead of relying on generic tags that those queries do not subscribe to.
GuideCityOptions comes from Geography’s staff-gated contract including all statuses;
only a published city can have publicly published guides.

See [execution/acceptance](../../../docs/specs/guides-cms-execution.md) and
[audit/inventory](../../../docs/specs/guides-cms-audit.md). Pure tests include patches,
visibility, ownership-order validation, city policy, media guards, partial-write
recovery, editor patches and query/card rendering. Integrated browser/persistence QA
is recorded separately; isolated fixtures must never be confused with production.

## Common Pages editorial integration

`GuidesListingRenderer` accepts optional injected Pages content and private preview
annotations; the public listing uses the same renderer and retains slice catalogue queries.
Editorial draft/publish lives in Pages, while individual entity workflows remain here.

### Guide locale forms (ADR0066)

The existing guide form now edits one complete tree per language. EN supplies the
working content of untouched ES/PT/FR; the first actual localized text/tree edit
makes that language independent. Save draft and Publish act on the selected
language only. GET projects legacy translations without writing. The first save
or archive bootstraps published baselines and private pending translations into
`guide_locale_content`, preserving legacy rows, translations and URLs.

Common city/template/position, images, section layout/module visibility and place
physical facts are stored in `guide_shared_content`. Stable section/place UUIDs
join this document to each localized tree. Historical map entries and the first
registered place parent remain intact when a localized tree removes or moves a
node. Save atomically checks the selected language, inherited English template,
common revision and node ownership under the same graph lock; it registers new
neutral nodes without deleting historical identities. Complete common maps can
include nodes present only in another language's unsaved form.

Public readers use only each language's publication plus the latest common data.
Unpublished languages do not fall back to English publications. Detail sections,
counts, mosaic, recommendations, listings, static params and alternates therefore
share the same published tree and visibility. The EN-derived common recommendation
classification remains stable when a place's displayed category is translated.
Legacy granular mutations refuse adapted roots, and legacy translation links
resolve child ownership back to the whole-guide editor.

Backend checks: `tests/guide-locale-model.test.ts` and
`tests/guide-locales.integration.test.ts`. The latter guards synthetic DB hostname,
DB and role before any writes, uses only its e790 fixtures, and cleans them in the
after hook. It requires the local server-only/static asset loader, AsyncLocalStorage
preload and a test-only staff loader when run outside a Next request.
