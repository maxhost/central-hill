# Data Model (DB source of truth)

> Postgres (Neon) via Drizzle. **Each table is owned by exactly one slice.** FKs may reference
> another slice's table only through entities marked *public* in that slice's `contract.ts`.
> Migrations are additive, numbered, forward-only; never edit a past migration (see `CLAUDE.md`).

## Conventions

- **IDs:** `uuid` primary keys (`gen_random_uuid()`), plus a human/SEO **slug** where public.
- **Timestamps:** `created_at`, `updated_at` on every table.
- **Soft state:** content entities have `status` ∈ `draft | published | archived`.
- **Ordering:** user-orderable lists carry an integer `position`.
- **Money/measures:** integers (cents, counts) — no floats for money.
- **Translatable text:** NOT stored as columns on the entity. Instead every translatable field
  is a row in a generic **translations** table keyed by `(entity_type, entity_id, field, locale)`
  with a per-locale `value` + `state`. See §"Translation model" below. This keeps adding a locale
  a data change, not a schema change.
- **Media:** referenced by `media_asset.id` (R2-backed), never raw URLs in content tables.

## Translation model (cross-cutting, owned by `core/i18n`)

```
translation
  id            uuid pk
  entity_type   text        -- 'building' | 'apartment' | 'blog_post' | 'service' | ...
  entity_id     uuid
  field         text        -- 'name' | 'description' | 'neighbourhood' | 'excerpt' | ...
  locale        text        -- 'en' | 'pt' | 'es' | 'fr'
  value         text        -- the translated content (rich text stored as portable JSON/MD)
  state         text        -- 'draft' | 'needs_review' | 'approved'
  source_hash   text        -- hash of source field at translation time (staleness detection)
  updated_by    uuid null   -- reviewer
  unique (entity_type, entity_id, field, locale)
```

- Source locale is authored directly; target locales are generated as `draft` by the LLM.
- Editing the source field re-hashes and flips dependent locales to `needs_review` (stale).
- Public pages select only `approved`; fallback policy = source locale (configurable).
- Per-locale **slugs** for public entities live in a parallel `slug(entity_type, entity_id,
  locale, slug)` unique table so URLs are localizable and collision-checked.

## Entity catalog (by slice)

### Slice `geography` — taxonomy used across the catalog
- **city**: `id, slug, position, status, country='PT', hero_media_id`. Translatable: `name`,
  `intro`. (Lisboa now; Porto later.)
- **neighbourhood**: `id, city_id→city, slug, position`. Translatable: `name`.
  - *Public contract:* `CityRef`, `NeighbourhoodRef`, list/get by slug.

### Slice `buildings` — core catalog entity
- **building**: `id, slug, status, position, is_new (badge), is_featured, city_id→city,
  neighbourhood_id→neighbourhood, street_address, cover_media_id, avantio_id?, avantio_url?`.
  - Computed/denormalized stats: `apartments_count, total_capacity, beds_count` (derived from
    apartments; persisted for fast static render, recomputed on apartment publish).
  - Translatable: `name`, `teaser` (~180 chars), `description_intro`, `description_neighbourhood`,
    `meta_title`, `meta_description`.
- **building_media**: `building_id, media_id, position` (gallery).
  - *Public contract:* `BuildingSummary` (card), `BuildingDetail`, `listBuildings(filter)`,
    `getBuildingBySlug`. Tags: `building:<id>`, `building-list`.

### Slice `apartments` — bookable unit (links to Avantio)
- **apartment**: `id, slug, status, position, building_id→building, bedrooms, bathrooms,
  max_guests, beds_count, size_m2?, floor?, cover_media_id, avantio_id, avantio_url`.
  - Translatable: `name`, `description`, `meta_title`, `meta_description`.
- **apartment_media**: gallery (as above).
- **amenity**: `id, slug, icon, group` (taxonomy). Translatable: `label`.
- **apartment_amenity**: `apartment_id, amenity_id` (M:N).
- **apartment_faq**: `apartment_id, position`. Translatable: `question`, `answer`.
  - *Public contract:* `ApartmentSummary`, `ApartmentDetail`, `listByBuilding`, `getBySlug`.
  - Publishing an apartment revalidates `apartment:<id>`, `building:<id>` (stats), `building-list`.

### Slice `blog`
- **blog_category**: `id, slug, color, position`. Translatable: `name`. (Seed: Owner Guides/teal,
  STR Tips/blue, Portugal Regulations/red, Lisbon/gold, Portugal/grey.)
- **blog_post**: `id, slug, status, category_id→blog_category, author_id?, cover_media_id,
  published_at, reading_minutes, is_featured, cta_label, cta_url`.
  - Translatable: `title`, `excerpt`, `body` (rich), `meta_title`, `meta_description`.
- **blog_post_related**: `post_id, related_post_id, position` (exactly 3 curated).
  - *Public contract:* `PostSummary`, `PostDetail`, `listPosts(category?)`, `getBySlug`.

### Slice `services` — guest services (index + detail)
- **service**: `id, slug, status, position, cover_media_id, price_from?, cta_label?, cta_url?`.
  - Translatable: `name`, `excerpt`, `body`, `meta_*`. Gallery via `service_media`.

### Slice `guides` — "What to Do" city guides (hierarchical content tree)
- **guide_page**: `id, city_id→city, template (landing|eat|beaches|events|secrets|families|groups|travellers|custom), slug, status, position, hero_media_id`. Translatable: `title, intro, meta_*`.
- **guide_section**: `id, guide_page_id, position, layout, header_media_id, cta_label?, cta_url?`.
  Translatable: `title, body, local_tip`.
- **guide_place**: `id, guide_section_id, position, address?, phone?, price_tier?, map_url?,
  website_url?, media_id?`. Translatable: `name, description`.
  - *Public contract:* `getCityGuides(citySlug)`, `getGuidePage(slug)`.

### Slice `testimonials` (shared by Home/Owners/Guests)
- **testimonial**: `id, audience (owner|guest), rating (1-5), author_name, author_country,
  property_location?, position, status`. Translatable: `quote`.

### Slice `faq` (grouped, shared)
- **faq_group**: `id, key (owners|real_estate|...), position`.
- **faq_item**: `id, group_id, position, status`. Translatable: `question, answer`.

### Slice `pages` — editable marketing singletons + reusable blocks
Home, Owners, Real Estate, About, Guest-landing are **page singletons** composed of ordered,
typed **content blocks** (hero, benefit-cards, stats, plans, journey-steps, dual-CTA, etc.).
- **page**: `id, key (home|owners|real_estate|about|guest), status`.
- **page_block**: `id, page_id, type, position, data (jsonb, validated per block type)`.
  Translatable fields inside a block are addressed as `field = 'block:<block_id>:<path>'`.
  - This keeps marketing pages fully editable without bespoke tables per section.

### Slice `leads` — form captures (DB + email + backoffice inbox)
- **lead**: `id, kind (earnings_estimate|deal_enquiry|contact|newsletter), status
  (new|in_progress|closed), locale, source_page, assigned_to?, created_at`.
- **lead_field**: `lead_id, key, value` (flexible per kind), or typed columns per kind if
  preferred — decided in the slice's ADR. Newsletter may be its own minimal table.
  - On submit: persist → `core/email` notifies staff → appears in backoffice inbox.

### Slice `globals` — site-wide settings (owned by `core` + a thin admin slice)
- **site_settings** (singleton): contact phones, email, WhatsApp, social URLs, company stats
  (bookings, years, guests, revenue, buildings, apartments), office address/hours.
  Translatable: stat labels, hours labels.
- **navigation** / **footer**: ordered link groups with translatable labels + targets.
  - Tag: `globals`, `nav` — revalidated site-wide on change.

### Slice `media` (kernel-adjacent, owned by `core/media` + thin admin)
- **media_asset**: `id, r2_key, mime, width, height, blurhash?, alt (translatable), credit?`.

### Slice `auth` (kernel `core/auth`)
- Better Auth tables (`user`, `session`, `account`, `verification`) + `staff_role`.

## Relationship map (ownership-respecting)

```
city ──1:N── neighbourhood
city ──1:N── building ──1:N── apartment ──M:N── amenity
                       └─ building_media        └─ apartment_media / apartment_faq
city ──1:N── guide_page ──1:N── guide_section ──1:N── guide_place
blog_category ──1:N── blog_post ──N:N── blog_post (related)
page ──1:N── page_block
lead (standalone)            testimonial (standalone, audience-tagged)
faq_group ──1:N── faq_item   service (standalone)
translation / slug / media_asset  ← referenced by everything (core)
```

## Schema-change rules (enforced in review)

1. New tables/columns → **new numbered migration**; never edit an applied one.
2. Cross-slice FK only to a table the other slice marks *public*. Otherwise denormalize or use the
   contract layer.
3. Dropping/renaming a column used by another slice → requires an **ADR + contract version bump**.
4. Adding a locale = inserting `translation` rows; **no schema change**.
5. Denormalized counters (e.g. `building.*_count`) are recomputed by the owning slice on publish,
   never written by another slice.
