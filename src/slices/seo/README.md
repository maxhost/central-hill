# Slice `seo` / `seo-geo` (S13)

The cross-cutting **SEO/GEO** slice. Owns **no tables**, **no migration**, and renders
**no page routes of its own**. It produces the site-wide discoverability artefacts the
thin app shell composes, and the kernel `core/seo` JSON-LD builders the public slices
consume. See `docs/seo-i18n.md` and **ADR 0020**.

## What it produces

- **Site-wide JSON-LD** — `SiteJsonLd` (server component) emits `Organization` +
  `LodgingBusiness` from `settings.getGlobals` (org name = constant `SITE_NAME`). Composed
  once into the public root layout `src/app/[locale]/layout.tsx`.
- **Sitemaps** — a sitemap index (`/sitemap.xml`) + per-section urlsets
  (`/sitemaps/<section>`: `pages`, `buildings`, `blog`, `services`, `guides`). Each `<url>`
  carries `<xhtml:link rel="alternate">` for every locale plus `x-default`.
- **`robots.txt`** (`/robots.txt`) — allows public, disallows `/admin` (ADR 0017) + `/api`,
  references the sitemap index.
- **`llms.txt`** / **`llms-full.txt`** (GEO) — markdown digests (llmstxt.org) of the site;
  the concise map and the full per-section URL list, built from the slice catalog.

## How URLs are enumerated (boundaries)

`server/urls.ts` collects every public URL **only through other slices' contracts**
(golden rule 2): the published `list*Params()` of buildings/blog/services/guides plus the
fixed marketing/index routes (`config.ts → STATIC_STEMS`). Per-locale `<xhtml:link>`
alternates are built by grouping an entity's published slugs across locales via the kernel
`loadAllSlugs(type)` (the flat params lose the entity id needed to cross-link locales).

`collectSitemap()` is `unstable_cache`-wrapped, tagged `cacheTags.sitemap`, with a **daily
revalidate fallback**, so the public routes never hit the DB at request time (ADR 0002).

**Apartments & cities** have no standalone public route today (apartments render inside
building detail; cities inside the guides index), so they are intentionally absent from the
sitemap. Adding their routes later is an additive section.

## Kernel additions (ADR 0020)

- `core/seo`: JSON-LD builders `organizationLd`, `localBusinessLd`, `faqPageLd`,
  `lodgingBusinessLd` (pure; same shape as the existing `blogPostingLd`/`breadcrumbLd`).
- `core/i18n`: read helper `loadAllSlugs(type)` → `{entity_id, locale, slug}[]`.

The two pre-existing S13 escalation notes were resolved with these builders:
`buildings/ui/building-detail.tsx` now emits `LodgingBusiness`, and
`pages/ui/components/faq-section.tsx` emits `FAQPage` (both append-only).

## Config

`SITE_URL` (→ `NEXT_PUBLIC_SITE_URL` → `https://centralhill.pt`) supplies the absolute
origin for all artefacts (`config.ts`). Added to `.env.example`.

## Contract (`contract.ts`)

`SiteJsonLd`; `collectSitemap` + `SitemapSection`/`SitemapUrl`/`SitemapAlternate`;
`buildSitemapIndex`, `buildUrlset`, `sectionPath`; `buildRobots`; `buildLlmsTxt`,
`buildLlmsFullTxt`; `siteUrl`, `absoluteUrl`, `SITE_NAME`. Page metadata (canonical +
hreflang + OG) and per-entity JSON-LD are built directly by each public slice via `core/seo`
— not re-exported here.

## Routes (brand-new, root / non-locale-prefixed)

`src/app/{sitemap.xml,sitemaps/[section],robots.txt,llms.txt,llms-full.txt}/route.ts` —
thin handlers importing only from this slice's contract.

## Deferred / follow-ups

- Wiring each content slice's `publish()` to also bust `cacheTags.sitemap` on create/delete
  (so a new/removed entity appears immediately instead of within the daily window) is a small
  per-slice follow-up. Until then the daily revalidate keeps the sitemap correct within a day.
- `lastmod` per URL (the `list*Params` don't carry `updated_at`); add when an enumerator
  exposes it.
- Apartment / city standalone routes + their sitemap sections, if/when those pages ship.

## Tests

`tests/seo.test.ts` — pure builder tests (config URL helpers, sitemap index/urlset
serializers incl. escaping + alternates, robots, and the ADR-0020 JSON-LD builders). Run:
`npx tsx --test src/slices/seo/tests/seo.test.ts`.
