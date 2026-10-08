# Domain map (2026-10-06)

The repository is organised as **vertical slices** (`src/slices/<slice>/`, catalogue in
`docs/vertical-slices.md`). Slices map closely to business domains, but each domain also spans
App Router routes (`src/app/[locale]/…` public, `src/app/(admin)/admin/(panel)/…` backoffice),
kernel tables (`translation`, `slug`, `media_asset`), the shared `messages/*.json`, `scripts/`
seeds and `mock/` baselines. "Depends on" lists the other slices' `contract.ts` files each slice
imports (measured with grep on 2026-10-06). Every slice also uses the kernel (`src/core/*`).

Common rules for every content domain (from `CLAUDE.md`, `docs/conventions.md`, ADRs):
- tables are slice-owned and changed only by new additive migrations;
- [T] fields go through `core/i18n` (never columns);
- admin writes are `requireStaff`-gated Server Actions that bust the slice's cache tags;
- public reads are cached and tag-scoped, with no DB access at request time.

---

## Catalogue

### Domain: Geography
Responsibilities: cities and neighbourhoods taxonomy (`city`, `neighbourhood`). No public routes.
Relevant code: `src/slices/geography/`, `src/app/(admin)/admin/(panel)/cities/`.
Depends on: backoffice. Used by: buildings, guides.
Sensitive: no.

### Domain: Buildings
Responsibilities: the catalogue's core entity: building, gallery (`building_media`),
building-level amenities and FAQ, denormalised apartment stats; listing and detail pages.
Relevant code: `src/slices/buildings/`, `src/app/[locale]/buildings/`,
`src/app/(admin)/admin/(panel)/buildings/`, `mock/buildings.html`, `mock/building-detail.html`.
External systems: Avantio (`avantio_id/url`, booking CTA).
Depends on: geography, apartments, pages (`OwnerEstimateForm`), settings, backoffice.
Used by: apartments, pages, seo.
Sensitive: no (but public SEO-critical).
Important rules: amenities and FAQ belong to the building, not the apartment.

### Domain: Apartments (bookable units)
Responsibilities: apartment rows (`apartment`, `apartment_media`) linked to Avantio; rendered
inside the building detail page. There is no apartments route of its own.
Relevant code: `src/slices/apartments/`, `src/app/(admin)/admin/(panel)/apartments/`.
External systems: Avantio.
Depends on: buildings, backoffice. Used by: buildings.
Sensitive: no.
Important rules: booking, availability and payments are **never** built here (ADR 0008).

## Editorial

### Domain: Blog
Responsibilities: posts, categories, authors, related posts; listing (featured post, category
chips, load-more, newsletter band) and article detail (`mock/blog-post.html`: TOC, callouts,
sidebar CTA from `page_content` key `blog`). The body is portable JSON (ADR 0013).
Relevant code: `src/slices/blog/`, `src/app/[locale]/blog/`, `src/app/(admin)/admin/(panel)/{posts,authors,blog-categories}/`,
`scripts/seed-blog.ts`, `mock/blog.html`.
Depends on: leads (newsletter form), backoffice. Used by: seo.
Sensitive: no.

### Domain: Guest services
Responsibilities: service catalogue (`service_category`, `service`, `service_media`). The
listing plus a detail page with one fixed skeleton (`mock/service-detail.html`) and a
per-service variable module. Rich content lives in the [T] JSON `detail`
(`src/slices/services/detail.ts`).
Relevant code: `src/slices/services/`, `src/app/[locale]/services/`,
`src/app/(admin)/admin/(panel)/{services,service-categories}/`, `scripts/seed-services.ts`.
Depends on: leads (enquiry form), settings (contact globals), backoffice.
Used by: pages (home services carousel, ADR 0032), seo.
Sensitive: no.
Important rules: bump the `getServiceBySlug` cache-key version when `ServiceDetail` changes shape.

### Domain: City guides ("What to Do")
Responsibilities: `guide_page → guide_section → guide_place` tree per city; index and detail
(`mock/guide-detail.html`: TOC, place cards, sidebar CTA from `page_content` key `guides`).
Relevant code: `src/slices/guides/`, `src/app/[locale]/guides/`, `scripts/seed-guides.ts`,
`mock/what-to-do.html`.
Depends on: geography. Used by: seo.
Sensitive: no.
Important rules: there is **no backoffice** for guides yet. The seed is the only writer.

### Domain: Testimonials
Responsibilities: audience-tagged testimonials, embedded by pages. No public routes.
Relevant code: `src/slices/testimonials/`, `src/app/(admin)/admin/(panel)/testimonials/`.
Depends on: backoffice. Used by: pages. Sensitive: no.

### Domain: FAQ
Responsibilities: grouped marketing FAQs (`faq_group`, `faq_item`), embedded by key, with
FAQPage JSON-LD. No public routes.
Relevant code: `src/slices/faq/`, `src/app/(admin)/admin/(panel)/faq/`.
Depends on: backoffice. Used by: pages. Sensitive: no.

## Composition & conversion

### Domain: Marketing pages
Responsibilities: the five editable fixed pages (Home, Owners, Real Estate, About, Guests), one
`page_content` row per key with a fixed Zod schema per page (ADR 0012). They compose other
slices' read models. Also exports `OwnerEstimateForm`.
Relevant code: `src/slices/pages/` (incl. `schemas/`), `src/app/[locale]/{page.tsx,owners,real-estate,about,guests}`,
`src/app/(admin)/admin/(panel)/pages/`, `scripts/backfill-*.ts`, `mock/{home,owners,real-estate,about,guest}.html`.
Depends on: buildings, services, testimonials, faq, settings, leads, backoffice.
Used by: buildings.
Sensitive: no.
Important rules: no generic block builder; new sections are a dev task (schema + template).

### Domain: Leads
Responsibilities: one pipeline for four form kinds (earnings estimate, deal enquiry, contact,
newsletter): `lead` + `lead_field`, explicit GDPR consent (ADR 0014), staff email notify, admin
inbox.
Relevant code: `src/slices/leads/`, `src/app/(admin)/admin/(panel)/leads/`, `src/core/email/`.
External systems: email vendor (not wired; console/noop).
Depends on: backoffice. Used by: blog, services, settings, pages.
Sensitive: **yes**. Personal data and consent records.

### Domain: Site settings & navigation
Responsibilities: `company_settings` singleton (contact, social, stats, office, currency,
Avantio account config, default OG image) and `nav_item` menus; header, footer, WhatsApp
FAB, Avantio search bar.
Relevant code: `src/slices/settings/`, `src/app/(admin)/admin/(panel)/{settings,navigation}/`.
External systems: Avantio (search widget), WhatsApp deep link.
Depends on: leads, backoffice. Used by: buildings, services, pages, seo.
Sensitive: moderate. Changes revalidate the whole site.

---

## Shared / cross-cutting areas

### Backoffice & authentication
`src/slices/backoffice/` (admin shell, `composeAdminNav`, form/media primitives exported via
its contract), `src/app/(admin)/`, `src/core/auth/` (Better Auth, `staff_role`,
`requireStaff`), `src/app/api/auth/`, `scripts/create-admin.ts`. Every slice's `admin/`
plugs into it. **Sensitive: yes.**

### Translation / i18n
`src/core/i18n/` (`translation` + `slug` tables, read/write seams, translate provider),
`src/slices/translation/` (review inbox, `generateDrafts`; owns no tables), `src/i18n/`,
`src/proxy.ts`, `messages/*.json`. Operates on every content entity generically by
`entity_type`. Sensitive: the write seam is (`content-write.ts`).

### SEO / GEO
`src/slices/seo/` (sitemaps, robots, llms.txt; owns no tables), `src/core/seo/` (metadata,
JSON-LD), `src/app/{sitemap.xml,sitemaps,robots.txt,llms.txt,llms-full.txt}`. It consumes
blog, buildings, guides, services and settings contracts. Rules: `docs/seo-i18n.md`.

### Media
`src/core/media/` (R2 presign/ingest/delete, `MediaImage`, blurhash, `media_asset` with the
R2 | Stream backend; Stream is not implemented), `src/slices/media/` (validation only).
Runbooks: `docs/specs/r2-media-pipeline.md`, `docs/specs/r2-runbook.md`. **Sensitive:** the
server ingest and delete code.

### Design system & mocks
`src/core/ui/` (presentational components, no i18n, no `@core/media`), `src/app/globals.css`
(`@theme` tokens, Warm Editorial), `src/core/ui/icon*` (the single Iconoir icon system, ADR
0034), `mock/` (approved baselines). Process: `docs/component-extraction-workflow.md`,
`docs/design-system.md`, `docs/mock-agent-contract.md`.

### Persistence
`src/core/db/`, `drizzle/` (0000–0014 + journal), `drizzle.config.ts`, `pnpm db:check` /
`scripts/check-migration-order.ts`, `scripts/fix-migration-ledger.ts`. **Sensitive: yes.**

### Revalidation
`src/core/revalidate/` + each slice's `server/publish.ts` and `contract.ts` cache tags.

---

## Dependency sketch (contract imports)

```
pages ──▶ buildings, services, testimonials, faq, settings, leads
buildings ──▶ geography, apartments, pages*, settings
apartments ──▶ buildings
services ──▶ leads, settings
blog ──▶ leads
settings ──▶ leads
guides ──▶ geography
seo ──▶ blog, buildings, guides, services, settings
(all with admin) ──▶ backoffice ;  every slice ──▶ src/core/*
```

## Known architectural ambiguities (domain level)

- **Contract-level cycles:** `buildings ↔ apartments` (buildings detail lists apartments;
  apartments read their building), and `buildings ↔ pages`. `buildings-listing.tsx` reuses
  `pages`' `OwnerEstimateForm`, while pages composes buildings. These work today but break the
  topological order in `docs/vertical-slices.md`.
- **Guides has no admin.** Unlike every other content domain, `guide_place` and friends are
  only written by `scripts/seed-guides.ts`.
- **Leads' email side-effect is a no-op in production** until a vendor ADR lands, so "staff
  notified" is not actually true yet.
- **Owner-estimate form ownership:** it lives in `pages` but is reused by `buildings`; whether
  it belongs to `leads` is not decided in the docs.
- **`src/slices/media` vs `src/core/media`:** the slice is a near-empty stub, and the role
  split is undocumented.
