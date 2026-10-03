# Slice `guides` (S6)

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
  (standard|with_cta|with_media|featured_places), header_media_id?, cta_url?`.
  [T]: `title, body, local_tip, cta_label`.
- `guide_place` — `guide_section_id→guide_section (cascade), position, category?, address?,
  phone?, price_tier? (budget|mid|premium = €/€€/€€€), opening_hours?, latitude?,
  longitude?, website_url?, booking_url?, media_id?`. [T]: `name, description`.

`*_media_id` are loose uuids → `media_asset` (core/media), resolved through that kernel
module, never by querying its table.

**City data is read only through the geography contract** (`listCities`, `getCityBySlug`,
`CITY`, `GEO_TAGS`) — this slice never queries geography's tables (golden rule 2).

## Routes (App Router, ISR)

- `/[locale]/guides` — index: hero + one section per city with a card grid of its
  published guide pages (`listGuideCityGroups`). `revalidate = 3600` + tag-revalidated;
  the surrounding chrome (hero, city chips, "Top Recommendations", closing CTA band) is
  the approved mock's static markup, same `.mk`-embed-with-DB-driven-cards pattern as
  `buildings/ui/buildings-listing.tsx`.
- `/[locale]/guides/[city]/[slug]` — guide-page detail: breadcrumb, hero, a stack of
  sections (body, optional header image, "local tip" callout, place grid, optional CTA).
  `generateStaticParams` from `listGuideParams()`; `dynamicParams = true`. The `[city]`
  segment is verified against the page's `city_id` (a mismatched city → `notFound`).

## Content

The 8 real Lisbon guide pages (`things-to-do-in-lisbon`, `where-and-what-to-eat-in-lisbon`,
`beaches-near-lisbon`, `events-and-festivals-in-lisbon`, `secrets-of-lisbon`,
`lisbon-for-families-and-kids`, `lisbon-for-groups-and-friends`, `information-for-travellers`
— one per `GuideTemplate`) are written by `scripts/seed-guides.ts`, adapted from the live
centralhill.pt "What to do in Lisbon" pages. It is **not a migration**: idempotent,
re-runnable, and writes through the same seams (`core/i18n` source content + slugs,
`core/media` R2 ingest) the future admin (S12) will use — re-run it after editing the
seed's content arrays. Source locale (`en`) only; `pt`/`es`/`fr` fall back to it until
translated (same accepted gap as `scripts/seed-services.ts`).

  pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/seed-guides.ts

## Contract (`contract.ts`)

Types: `GuidePageSummary`, `GuidePageDetail`, `GuideSection`, `GuidePlace`,
`GuideCityGroup`, `GuideCityRef`, `GuideTemplate`, `GuideLayout`, `GuidePriceTier`.
Reads: `listGuideCityGroups(locale)`, `getGuidePage(locale, citySlug, pageSlug)`,
`listGuideParams()`.
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
per-city heading, card CTA, breadcrumb, "local tip", place meta labels (address/hours/
phone) and outbound link labels (website/book/directions). DB content ([T] fields)
resolves through `core/i18n` with the source-locale (`en`) fallback + `approved`-only
gating. Section `body` is plain rich text rendered as paragraphs.

## Revalidation (`server/publish.ts`)

`revalidateGuides()` — the single place that busts the `guide-list` tag (index + every
detail subscribe). Called by the guides admin actions (S12).

## Deferred (not in this slice's first cut)

- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12** — guide-page tree
  editor (sections/places ordering), media pickers, translation review.
- **Map embed**: places expose `latitude`/`longitude`; the UI links out to Google Maps.
  An interactive map widget is a kernel/app-shell decision (ADR), not hand-rolled here.
- **Guide/ItemList JSON-LD**: only `BreadcrumbList` is emitted; a richer
  `ItemList`/`TouristAttraction` builder belongs in `core/seo` (**S13**, ADR — golden
  rule 3).

## Tests

`tests/guides.test.ts` — page / section / place input validation + the translatable-path
contract. Run: `npx tsx --test src/slices/guides/tests/guides.test.ts`.
