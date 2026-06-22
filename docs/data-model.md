# Data Model (DB source of truth)

> Postgres (Neon) via Drizzle. **Each table is owned by exactly one slice.** FKs may reference
> another slice's table only through entities marked *public* in that slice's `contract.ts`.
> Migrations are additive, numbered, forward-only; never edit a past migration (see `CLAUDE.md`).
>
> **Consolidated from the client content briefs (`cliente-docs/`) and the HTML mockups (`mock/`).**
> This pass reconciled every page against the briefs/mockups and closed all known gaps. See the
> "Reconciliation notes" at the end for what changed vs. the first draft and why.

## How content is split (read this first)

The public site is **statically rendered (ISR)**; pages never hit the DB at request time. Content
that an admin edits falls into exactly **three buckets** — choosing the right bucket is the most
important modeling decision:

1. **Dynamic entities** — collections the admin manages as records via CMS list+form screens:
   buildings, apartments, blog posts, services, city guides, testimonials, leads.
2. **Editable fixed pages** — the marketing pages (`home`, `owners`, `real_estate`, `about`,
   `guest`) have a **layout fixed in code**. Only their *text/media values* are editable, through a
   **fixed per-page form** (a known schema — **not** a drag-and-drop block builder). Stored in
   `page_content`. See §"Page content model".
3. **Company-wide settings** — stats, contact, social, office, navigation, footer, Avantio config:
   the `company_settings` singleton (+ `nav_item`).

Truly static UI chrome (button labels, generic microcopy) lives in **next-intl message files**, not
the DB. On any publish/save, the owning slice triggers **ISR on-demand revalidation** (we do *not*
commit generated HTML to git).

## Conventions

- **IDs:** `uuid` primary keys (`gen_random_uuid()`), plus a human/SEO **slug** where public.
- **Timestamps:** `created_at`, `updated_at` on every table.
- **Soft state:** content entities have `status` ∈ `draft | published | archived`.
- **Ordering:** user-orderable lists carry an integer `position`.
- **Money/measures:** integers (cents, counts) — no floats for money.
- **Translatable text:** NOT stored as columns on the entity. Instead every translatable field
  is a row in a generic **translation** table keyed by `(entity_type, entity_id, field, locale)`
  with a per-locale `value` + `state`. See §"Translation model". This keeps adding a locale a data
  change, not a schema change. Below, translatable fields are marked **[T]**.
- **Media:** referenced by `media_asset.id` (R2-backed), never raw URLs in content tables.
- **SEO:** public entities carry `meta_title` **[T]**, `meta_description` **[T]**, and an optional
  `og_image_media_id` (overrides the cover image for social/OG; falls back to the cover). Per-locale
  **slugs** live in the `slug` table. hreflang/canonical/JSON-LD are derived in `core/seo` — no extra
  per-entity columns (see `docs/seo-i18n.md`).

## Translation model (cross-cutting, owned by `core/i18n`)

```
translation
  id            uuid pk
  entity_type   text        -- 'building' | 'apartment' | 'blog_post' | 'service' | 'page_content' | ...
  entity_id     uuid
  field         text        -- 'name' | 'description' | 'excerpt' | 'block:<key>' (see page_content)
  locale        text        -- 'en' | 'pt' | 'es' | 'fr'
  value         text        -- the translated content (rich text stored as portable JSON/MD)
  state         text        -- 'draft' | 'needs_review' | 'approved'
  source_hash   text        -- hash of source field at translation time (staleness detection)
  updated_by    uuid null   -- reviewer
  unique (entity_type, entity_id, field, locale)
```

- Source locale is authored directly; target locales are generated as `draft` by the LLM pipeline.
- Editing the source field re-hashes and flips dependent locales to `needs_review` (stale).
- Public pages select only `approved`; fallback policy = source locale (configurable).

```
slug
  entity_type  text
  entity_id    uuid
  locale       text
  slug         text
  unique (entity_type, locale, slug)   -- collision-checked, localizable URLs
```

## Page content model (`pages` slice) — the editable fixed pages

Five marketing pages are editable through a **fixed form per page**, not arbitrary blocks. Each page
has a known, validated schema (Zod in code) that both renders the admin form and validates on save.

```
page_content
  id        uuid pk
  key       text unique   -- 'home' | 'owners' | 'real_estate' | 'about' | 'guest'
  status    text          -- draft | published
  data      jsonb         -- SOURCE-locale values, validated against the page's fixed schema
  og_image_media_id  uuid null
```

- **Translations:** target-locale copies are stored via the `translation` table with
  `entity_type='page_content'`, `entity_id=page_content.id`, `field='block:<dot.path>'` (e.g.
  `block:owners_benefits.0.title`). The page schema declares which leaf paths are **[T]**.
- Repeating groups are **fixed-count arrays** in the schema (e.g. exactly 6 benefit cards) — the form
  shows a fixed number of slots, never "add block".
- Values that are inherently dynamic/shared are **not** copied into `data`; they reference other
  slices at render time (see per-page notes).
- On save+publish → `revalidatePath('/{locale}/<page>')` for all 4 locales.

### Per-page schemas (fields condensed; all prose fields are [T])

- **home**: `hero{video_media_id, headline, subtitle, cta_primary{label,url}, cta_secondary{label,url}}`;
  `owners_pitch{headline, subheadline, benefits[×6]{icon_key,title,description}, cta_primary{label,url,note}, cta_secondary{label,url,note}}`;
  `guests_pitch{headline, subheadline, benefits[×6]{icon_key,title,description}, cta{label,url,note}}`;
  `story{headline, copy, image_media_id, cta{label,url}}`.
  → Stats band = **company_settings**; featured portfolio = **buildings** (`is_featured`, top 3 by position);
  testimonials = **testimonials** entity (mixed audience); dual-CTA = **company_settings** contact.
- **owners**: `hero{image_media_id, headline, copy}`; `earnings_form{badge, headline, subheadline, cta_label, note}`
  (the form *fields* are fixed in code → `lead.kind='earnings_estimate'`; the `badge` — "★ Earn +25%" —
  is highlighted inside the form card). Owner direction (drizzle/0004): a focused conversion landing —
  the marketing sections `why / services / plans / journey / dashboard` were **removed** from the page,
  the schema, and the stored row.
  → Stats ("numbers" band) = **company_settings**.
- **real_estate**: `hero{image_media_id, headline, subheadline, positioning, capability_statement_media_id, cta_primary{label,url}, cta_secondary{label,url}}`;
  `partners{headline, intro, types[×4]{icon_key,title,description}}`; `capabilities{headline, intro, items[×3]{...}}`;
  `asset_classes{headline, intro, items[×6]{...}}`; `models{headline, intro, items[×3]{name, tag, is_featured, features[×7]}, footer_note}`;
  `market{headline, intro, blocks[×4]{title, copy|bullets}}`; `track_record{headline, intro, metrics[×6]{value, label, caption}}`;
  `process{headline, intro, steps[×5]{title, description}}`; `enquiry{headline, intro, contact_email, contact_phone, contact_linkedin}`
  (form fields fixed in code → `lead.kind='deal_enquiry'`). → FAQ group `real_estate` referenced.
- **about**: `hero{image_media_id, eyebrow, headline, mission}`; `story{eyebrow, headline, narrative[×3]}`;
  `serve{headline, intro, audiences[×3]{icon_key,title,description}}`; `values{headline, intro, items[×4]{title,description}}`;
  `organisation{eyebrow, headline, intro, departments[×6]{icon_key,name,description}}`;
  `certifications{headline, intro, items[×3]{icon_key,title,issuer,description}}`;
  `community{eyebrow, headline, copy[×2], image_media_id}`;
  `contact{headline, cta_guests{label,url}, cta_owners{label,url}, cta_partners{label,url}, form{headline,subheadline}}`
  (form → `lead.kind='contact'`). → Stats band & office block = **company_settings**.
  Team/departments, partners, certifications, "founded 2012" are **static copy here** — no entities.
- **guest**: `hero{video_media_id, eyebrow, headline, subheadline, cta{label,url}}`;
  `welcome{headline, lede, copy, guarantee_label, image_media_id}`;
  `why{headline, intro, benefits[×4]{icon_key,title,description}, cta{label,url,note}}`;
  `services_teaser{headline, intro, items[×6]{icon_key,title,description}, cta{label,url,note}}`;
  `activities_teaser{headline, intro, items[×6]{icon_key,title,description}, cta{label,url}}`.
  → Featured portfolio = **buildings**; testimonials (audience=guest) referenced; dual-CTA = company_settings.

> `icon_key` everywhere is an enum referencing a curated icon set (iconoir names) shipped in code; no
> icon table. The Owners per-section anchor sub-nav is derived from the fixed sections in code.

## Entity catalog (by slice)

### Slice `geography` — taxonomy used across the catalog
- **city**: `id, slug, position, status, country='PT', hero_media_id`. **[T]** `name`, `intro`.
- **neighbourhood**: `id, city_id→city, slug, position`. **[T]** `name`.
  - *Public contract:* `CityRef`, `NeighbourhoodRef`, list/get by slug. (Neighbourhood descriptive
    prose is authored per building, not centralized — see `building.description_neighbourhood`.)

### Slice `buildings` — core catalog entity
- **building**: `id, slug, status, position, is_new (badge), is_featured, city_id→city,
  neighbourhood_id→neighbourhood, street_address, latitude?, longitude?, cover_media_id,
  og_image_media_id?, avantio_id?, avantio_url?`.
  - Denormalized stats (recomputed on apartment publish): `apartments_count, total_capacity, beds_count`.
  - **[T]**: `name`, `headline` ("The Building" title), `teaser` (~180 chars), `description_intro`,
    `description_neighbourhood`, `meta_title`, `meta_description`.
- **building_media**: `building_id, media_id, position` (gallery).
- **building_amenity**: `building_id, amenity_id` (M:N). **Amenities are building-level** (the mockup
  shows one shared 12-item set per building).
- **building_faq**: `id, building_id, position`. **[T]** `question`, `answer`. **FAQ is building-level**
  (questions are about the building: check-in, elevator, pets, parking…).
- **amenity** (taxonomy): `id, slug, icon, group?`. **[T]** `label`. (Seed: WiFi, AC, kitchen, washer,
  TV, elevator, self-check-in, heating, workspace, coffee, hairdryer, city view, …)
  - *Public contract:* `BuildingSummary` (card), `BuildingDetail`, `listBuildings(filter)`,
    `getBuildingBySlug`. Filterable: `city_id`, `neighbourhood_id`, `is_new`, `is_featured`, and
    (via apartments) bedrooms/max_guests. Tags: `building:<id>`, `building-list`.

### Slice `apartments` — bookable unit (links to Avantio)
- **apartment**: `id, slug, status, position, building_id→building, badge? (e.g. "Penthouse"),
  bedrooms, bathrooms, max_guests, beds_count, size_m2?, floor?, cover_media_id, og_image_media_id?,
  avantio_id, avantio_url`. **[T]**: `name`, `description`, `meta_title`, `meta_description`.
- **apartment_media**: `apartment_id, media_id, position` (gallery).
  - *Public contract:* `ApartmentSummary`, `ApartmentDetail`, `listByBuilding`, `getBySlug`.
  - Publishing revalidates `apartment:<id>`, `building:<id>` (stats), `building-list`.
  - **Amenities & FAQ live on the building**, not the apartment (`apartment_amenity`/`apartment_faq`
    were removed in this consolidation — the mockups present them building-wide).

### Slice `blog`
- **blog_category**: `id, slug, color, position`. **[T]** `name`. (Seed: Owner Guides/teal, STR
  Tips/blue, Portugal Regulations/red, Lisbon/gold, Portugal/grey.) **One category per post; no tags.**
- **author**: `id, slug, status, avatar_media_id?`. **[T]** `name`, `bio?`. (Default byline:
  "Central Hill Apartments"; structure supports individual authors later.)
- **blog_post**: `id, slug, status, category_id→blog_category, author_id→author, cover_media_id,
  og_image_media_id?, published_at, reading_minutes, is_featured, cta_label?, cta_url?`.
  - **[T]**: `title`, `excerpt`, `body` (portable JSON — see block set), `meta_title`, `meta_description`.
- **blog_post_related**: `post_id, related_post_id, position` (exactly 3 curated).
  - **Body block set** (portable JSON; never raw URLs): `heading{level, number?, text}`, `paragraph`,
    `list{ordered, items[]}`, `image{media_id, caption?, alt?}`, `quote`, `callout{variant, body}`,
    `divider`, `cta{label, url}`. Inline images resolve `media_id → media_asset` at render.
  - Index: category filter (URL `?category=`), featured post first, load-more (offset/limit).
  - Newsletter signup → `lead.kind='newsletter'`.
  - *Public contract:* `PostSummary`, `PostDetail`, `listPosts(category?)`, `getBySlug`.

### Slice `services` — guest services (index + detail)
- **service**: `id, slug, status, position, category_id→service_category, cover_media_id,
  og_image_media_id?, price_from? (cents), duration_label?, booking_type (enquiry|external|none),
  cta_label?, cta_url?`. **[T]**: `name`, `excerpt`, `body` (rich), `meta_title`, `meta_description`.
- **service_category**: `id, slug, icon, position`. **[T]** `name`. (Seed from mockup tags: Arrival,
  Day Trip, On the Water, Experience, At Home, Convenience, Family.)
- **service_media**: `service_id, media_id, position` (gallery).
  - *Public contract:* `ServiceSummary`, `ServiceDetail`, `listServices(category?)`, `getBySlug`.
  - (`booking_type='external'` → `cta_url` to the existing centralhill.pt/partner page; `'enquiry'`
    → routes to the guest contact path. No price *variants* — single `price_from`.)

### Slice `guides` — "What to Do" city guides (hierarchical content tree)
- **guide_page**: `id, city_id→city, template, slug, status, position, hero_media_id, og_image_media_id?`.
  `template` ∈ `landing | eat | beaches | events | secrets | families | groups | travellers | custom`.
  **[T]** `title, intro, meta_title, meta_description`.
- **guide_section**: `id, guide_page_id, position, layout, header_media_id?, cta_label?, cta_url?`.
  `layout` ∈ `standard | with_cta | with_media | featured_places`. **[T]** `title, body, local_tip`.
- **guide_place**: `id, guide_section_id, position, category?, address?, phone?, price_tier?
  (budget|mid|premium ≈ €/€€/€€€), opening_hours?, latitude?, longitude?, website_url?, booking_url?,
  media_id?`. **[T]** `name, description`.
  - *Public contract:* `getCityGuides(citySlug)`, `getGuidePage(slug)`.

### Slice `testimonials` (shared by Home/Owners/Guests)
- **testimonial**: `id, audience (owner|guest), rating (1-5), author_name, author_country,
  property_location?, position, status`. **[T]** `quote`.

### Slice `faq` (grouped, shared — marketing-page FAQs)
- **faq_group**: `id, key (owners|real_estate|guest|...), position`.
- **faq_item**: `id, group_id, position, status`. **[T]** `question, answer`.
  - Distinct from `building_faq` (which is per-building, owned by `buildings`).

### Slice `leads` — form captures (DB + email + backoffice inbox)
- **lead**: `id, kind (earnings_estimate|deal_enquiry|contact|newsletter), status
  (new|in_progress|closed), locale, source_page, assigned_to?, created_at`.
  - **Consent/GDPR (PT/EU):** `marketing_consent (bool)`, `consent_text` (snapshot of the shown
    notice), `consent_at`, `ip_address`, `user_agent`.
- **lead_field**: `lead_id, key, value` — flexible per kind. Examples:
  - `earnings_estimate`: `property_address, num_properties, num_bedrooms`.
  - `deal_enquiry`: `company_name, contact_name, contact_title, email, phone, country, asset_type,
    units_count, locations, current_status, target_model, timeline, notes`.
  - `contact`: `name, email, subject, message`. · `newsletter`: `email`.
  - On submit: persist → `core/email` notifies staff → appears in backoffice inbox.

### Slice `settings` / `globals` — site-wide (thin admin slice over kernel)
- **company_settings** (singleton): contact phones, email, WhatsApp, social URLs; company stats
  (bookings, years, guests, revenue, buildings, apartments) with **[T]** stat labels; office
  address/hours (**[T]** hours label); `currency='EUR'`; default `og_image_media_id`;
  **Avantio config** `avantio_account_id`, `avantio_widget_config (jsonb)`.
- **nav_item**: `id, location (header|footer), parent_id?, position, url`. **[T]** `label`. Covers the
  primary nav, the two persistent CTAs (Book Now / List Your Property), and footer link columns.
  - Tag: `globals`, `nav` — revalidated site-wide on change.

### Slice `media` (kernel-adjacent, owned by `core/media` + thin admin)
- **media_asset**: `id, r2_key, mime, width, height, blurhash?, credit?`. **[T]** `alt`. (Video assets
  for heroes are referenced the same way; the player/poster is chosen by mime in the UI.)

### Slice `auth` (kernel `core/auth`)
- Better Auth tables (`user`, `session`, `account`, `verification`) + `staff_role`.

## Relationship map (ownership-respecting)

```
city ──1:N── neighbourhood
city ──1:N── building ──1:N── apartment ── (gallery) apartment_media
       │            ├─ building_media (gallery)
       │            ├─ building_amenity ──M:N── amenity
       │            └─ building_faq
city ──1:N── guide_page ──1:N── guide_section ──1:N── guide_place
blog_category ──1:N── blog_post ──N:N── blog_post (related)   author ──1:N── blog_post
service_category ──1:N── service ── (gallery) service_media
page_content (5 singletons)        faq_group ──1:N── faq_item
testimonial (standalone, audience-tagged)        lead ──1:N── lead_field
company_settings (singleton)       nav_item (header/footer)
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

## Reconciliation notes (what changed in this consolidation, and why)

- **Removed the generic `page_block` builder.** Marketing pages have fixed layouts; only values are
  editable, via fixed per-page schemas in `page_content`. Simpler, fewer moving parts, cleaner i18n.
- **Amenities & FAQ moved to building level** (`building_amenity`, `building_faq`); dropped
  `apartment_amenity`/`apartment_faq` — the mockups present these per building.
- **Added** `building.headline`, `apartment.badge`, `building/guide_place` lat-long,
  `og_image_media_id` on public entities + page_content + settings default.
- **Added** `author` entity (was referenced but undefined); blog body block set specified; blog keeps
  a **single category, no tags** (cleanest for SEO/GEO topical authority).
- **Services**: added `service_category`, `booking_type`, optional `duration_label`. **No** price
  variants (not in client docs — was an inference).
- **Leads**: added GDPR consent fields; documented `lead_field` keys per kind.
- **company_settings** absorbs stats/contact/office/nav/footer + Avantio + OG default. Team members,
  partners, milestones, investment-property/deal listings are **not** entities (static copy on About /
  Real Estate, confirmed against the briefs).
- hreflang/canonical/JSON-LD/sitemap remain **derived** (no per-entity columns) per `docs/seo-i18n.md`.
