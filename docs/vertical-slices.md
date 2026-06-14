# Vertical Slice Catalog & Dependency Graph

> Each slice owns `src/slices/<slice>/` end-to-end and the DB tables listed for it in
> `docs/data-model.md`. The orchestrator schedules by the dependency graph below; disjoint slices
> run in parallel. "Consumes" = contracts this slice imports; "Produces" = the contract it exports.

## Foundation (build first — shared kernel & app shell)

### S0 · platform-foundation  *(kernel, change-controlled after this)*
Next.js App Router + TS strict, Tailwind + design-system primitives (`core/ui`), Drizzle+Neon
(`core/db`), Better Auth (`core/auth`), next-intl runtime + translation service interface
(`core/i18n`), R2 media pipeline (`core/media`), email (`core/email`), SEO helpers (`core/seo`),
ISR/revalidation helpers (`core/revalidate`), middleware (host split public vs backoffice, locale
routing), base layout/nav/footer shell, CI + boundary check.
- **Produces:** all kernel contracts. **Consumes:** —. **Blocks:** everything.

## Catalog domain

### S1 · geography   `city`, `neighbourhood`
- Produces: `CityRef`, `NeighbourhoodRef`, list/get. Consumes: core. Blocks: buildings, guides, pages.

### S2 · buildings   `building`, `building_media`, `amenity`, `building_amenity`, `building_faq`
- Produces: `BuildingSummary`, `BuildingDetail`, `listBuildings`, `getBuildingBySlug`; tags
  `building:*`, `building-list`. Consumes: geography, media, i18n, seo, revalidate.
- Amenities & FAQ are **building-level** (mockups present them per building). Blocks: apartments
  (FK), pages (featured widget), seo sitemaps.

### S3 · apartments   `apartment`, `apartment_media`
- The bookable unit. Owns the **Avantio embed** (`core/embeds` wrapper). Recomputes building
  stats on publish. Amenities & FAQ live on the **building** (S2), not here. Produces:
  `ApartmentSummary`, `ApartmentDetail`, `listByBuilding`. Consumes: buildings, geography, media.
  Blocks: pages (featured), seo.

## Editorial domain (largely parallel once S0–S1 land)

### S4 · blog   `blog_category`, `author`, `blog_post`, `blog_post_related`
- Produces: `PostSummary`, `PostDetail`, `listPosts`, `getBySlug`. Consumes: media, i18n, seo.
  One category per post, no tags; body is a portable-JSON block set (ADR 0013).

### S5 · services   `service_category`, `service`, `service_media`
- Produces: `ServiceSummary`, `ServiceDetail`, `listServices`. Consumes: media, i18n, seo.

### S6 · guides   `guide_page`, `guide_section`, `guide_place`  (What-to-Do tree)
- Produces: `getCityGuides`, `getGuidePage`. Consumes: geography, media, i18n, seo.

### S7 · testimonials   `testimonial`
- Produces: `listTestimonials(audience?)`. Consumes: i18n. (Used by pages.)

### S8 · faq   `faq_group`, `faq_item`
- Produces: `getFaqGroup(key)`. Consumes: i18n, seo (FAQPage JSON-LD).

## Composition & conversion

### S9 · pages   `page_content`   (Home, Owners, Real Estate, About, Guest landing)
- Editable fixed pages — one `page_content` row per page `key`, fixed per-page Zod schema in
  `data jsonb`, **no generic block builder** (ADR 0012). **Consumes** buildings (featured),
  testimonials, faq, services (teasers) via their contracts — pure composition, no foreign tables.
- Produces: `getPage(key)`. Consumes: buildings, apartments, testimonials, faq, services, settings.

### S10 · leads   `lead`, `lead_field` (+ newsletter)
- Forms: earnings-estimate, deal-enquiry, contact, newsletter. DB + email notify + backoffice
  inbox. Produces: `submitLead`, admin inbox. Consumes: email, i18n.

### S11 · settings (globals)   `company_settings`, `nav_item`
- `company_settings` singleton (contact, social, company stats, office, currency, Avantio config,
  default OG image) + `nav_item` (header/footer menus, the two persistent CTAs). Source values
  inline; [T] bits via `translation`. Produces: `getGlobals`, `getNav`. Consumes: media, i18n.
  Site-wide revalidation on change. *(Slice dir: `src/slices/settings/`.)*

## Cross-cutting (mostly in S0, extended as slices land)

### S12 · backoffice-shell
- Auth-gated admin app skeleton, navigation, the CRUD/list/translation-review framework that each
  slice's `admin/` plugs into. Consumes: auth, i18n, all slice admin registrations.

### S13 · seo-geo
- Sitemaps (per-locale, per-entity), `hreflang`, canonical, robots, **`llms.txt`**, JSON-LD
  builders (Organization, LocalBusiness, Apartment/Product, BlogPosting, FAQPage, BreadcrumbList).
  Consumes: every public slice's contract to enumerate URLs. See `docs/seo-i18n.md`.

### S14 · translation-pipeline
- LLM draft → `needs_review` → `approved` workflow + backoffice review inbox, operating on the
  `translation` table. Built on `core/i18n`. Consumes: every content slice (generically, by
  `entity_type`).

## Dependency graph (topological)

```
S0 platform-foundation
 ├─ S1 geography
 │   ├─ S2 buildings ── S3 apartments
 │   └─ S6 guides
 ├─ S4 blog      S5 services      S7 testimonials      S8 faq      S11 settings
 ├─ S12 backoffice-shell ── (admin of S2..S11 plug in)
 ├─ S14 translation-pipeline ── (operates on S2,S3,S4,S5,S6,S7,S8,S9 content)
 └─ S9 pages (consumes S2,S3,S5,S7,S8,S11)
     └─ S13 seo-geo (consumes all public slices; lands last per slice, incrementally)
```

## Suggested build waves (for parallel dispatch)

| Wave | Slices (parallel) | Gate |
|---|---|---|
| 0 | **S0** foundation | kernel contracts frozen + CI/boundary-check live |
| 1 | **S1** geography, **S11** settings, **S12** backoffice-shell skeleton | contracts published |
| 2 | **S2** buildings, **S4** blog, **S5** services, **S7** testimonials, **S8** faq | each: DoD + review |
| 3 | **S3** apartments, **S6** guides, **S10** leads, **S14** translation-pipeline | + Avantio embed verified |
| 4 | **S9** pages (composition), **S13** seo-geo (per public slice) | Lighthouse + hreflang + JSON-LD checks |

Each wave merges only after its slices pass the Definition of Done and adversarial review.
Migration numbers are allocated by the orchestrator per wave to avoid sequence collisions.
