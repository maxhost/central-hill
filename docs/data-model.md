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
   `guest`, plus the `buildings` listing's sections) have a **layout fixed in code**. Only their *text/media values* are editable, through a
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
  key       text unique   -- 'home' | 'owners' | 'real_estate' | 'about' | 'guest' | 'blog' | 'guides' | 'buildings'
  data      jsonb         -- SOURCE-locale values, validated against the page's fixed schema
  og_image_media_id  uuid null
```

- **Translations:** target-locale copies are stored via the `translation` table with
  `entity_type='page_content'`, `entity_id=page_content.id`, `field='block:<dot.path>'` (e.g.
  `block:owners_benefits.0.title`). The page schema declares which leaf paths are **[T]**.
- Repeating groups are **fixed-count arrays** in the schema (e.g. exactly 6 benefit cards) — the form
  shows a fixed number of slots, never "add block".
  Exceptions are **bounded** lists (`between(min,max)`, e.g. Owners `plans.tiers[1..4]`, Home and
  Buildings `stats.figures[0..8]`): the editor shows "+ add" / remove within the bounds.
- Values that are inherently dynamic/shared are **not** copied into `data`; they reference other
  slices at render time (see per-page notes).
- On save+publish → `revalidatePath('/{locale}/<page>')` for all 4 locales.

### Per-page schemas (fields condensed; all prose fields are [T])

- **home** (as shipped by `docs/specs/home-admin-editor.md`, 2026-10-11; `src/slices/pages/schemas/home.ts`).
  **[T]** = translatable text (EN source in `data`, other locales via `translation` rows);
  **C** = shared across locales (media, icons, numbers, URLs, selectors). `?` = optional; every
  optional text and media field is blank-tolerant (`""` or absent behaves the same).

  | Path | Type | Class | Blank / absent → |
  |---|---|---|---|
  | `seo?.meta_title?` | string ≤70 (`seoShape`) | T | i18n `pages.home.metaTitle` |
  | `seo?.meta_description?` | string ≤200 (`seoShape`) | T | i18n `pages.home.metaDescription` |
  | *(column)* `og_image_media_id` | image | C | no OG override |
  | `hero.video_media_id` | `"" \| uuid`, video (MP4/WebM) | C | stock Pexels clip |
  | `hero.poster_media_id?` | `"" \| uuid`, image | C | stock Unsplash poster |
  | `hero.eyebrow?` | string ≤60 | T | i18n `pages.home.heroEyebrow` |
  | `hero.headline` | string ≤160, **required** | T | — |
  | `hero.subtitle?` | string ≤280 | T | omitted |
  | `hero.cta_primary{label, url}` | label ≤80 **required**; `url` absolute URL **required** | label T · url C | — |
  | `hero.cta_secondary{label}` | string ≤80, **required** (href fixed in code: `/<locale>/owners`) | T | — |
  | `stats?.title?` | string ≤160 | T | i18n `pages.stats.title` |
  | `stats?.figures?` | 0–8 × `statFigure{label ≤80, to (digits ≤15), prefix? ≤8, suffix? ≤8, group: bool}` | `label` T · rest C | **no rows → no band** (heading included) |
  | `guests_pitch.headline` | string ≤160, **required** | T | — |
  | `guests_pitch.subheadline?` | string ≤280 | T | omitted |
  | `guests_pitch.benefits` | exactly 4 × `{icon_key, title ≤120, description ≤400}` | icon C · text T | — |
  | `guests_pitch.image_media_id` | `"" \| uuid`; image (incl. animated WebP), MP4/WebM or Lottie (`.json`/`.lottie`) | C | stock Unsplash photo |
  | `guests_pitch.cta{label, url, note?}` | label ≤80, url absolute URL, note ≤160 | label/note T · url C | — |
  | `guests_pitch.badge?.label?` | string ≤120 | T | `guests_pitch.cta.note` |
  | `guests_pitch.badge?.icon_key?` | `"" \| icon key` | C | `check` |
  | `portfolio?.title?` | string ≤160 | T | i18n `pages.portfolio.title` |
  | `portfolio?.cta_label?` | string ≤80 | T | i18n `pages.portfolio.viewAll` |
  | `portfolio?.card_view_label?` | string ≤40 | T | i18n `pages.portfolio.view` |
  | `services_carousel{eyebrow?, headline, assurances[×3]{icon_key, label ≤60}, service_category_slug?}` | ADR 0032 | text T · icon/slug C | section hidden if the block is absent or no service matches |
  | `faq_group_key?` | `"" \| faq_group.key` | C | no FAQ |
  | `faq?.title?` | string ≤160 | T | i18n `pages.faqTitle` |
  | `dual_cta.{owner,guest}{image_media_id, eyebrow ≤60, title ≤160, body ≤400, cta_label ≤60}` | text required; image `"" \| uuid` | text T · image C | blank image → mock photo; links fixed in code (`/owners`, Avantio) |

  → Composed, not stored: featured portfolio cards = **buildings** (featured, by position);
  services carousel cards = **services** (ADR 0032); FAQ questions = **faq**; dual-CTA contact line
  = **company_settings**; Avantio search bar = **settings**. **The figures band is page content**
  since spec S5 — Home no longer reads `company_settings` stats (`scripts/backfill-home-stats.ts`
  pre-filled the live row with the 4 company figures, idempotently).
  → **Language rule (D1)** until the per-locale editor tabs exist: staff edit EN only. A blank
  optional text renders the i18n message of the visitor's locale (`orMessage`); a filled one renders
  that text, resolved through the `translation` overlay (approved target, else EN source).
  → History: ADR 0031 (2026-09-12) cut Home to a guest funnel; ADR 0032 added the services carousel;
  `b8693db` (2026-09-28, client direction) restored `dual_cta` and the featured portfolio; spec
  `home-admin-editor` (2026-10-11) added every optional field above. Rows written before a field
  existed still validate (all additions are optional), and keys the schema doesn't know are stripped
  on the next save.
  → **Caching:** `getHomePage` is `unstable_cache`-wrapped with tag `page:home` and **no time-based
  `revalidate`** (the route's `revalidate = 3600` re-renders from the same cached data entry). A
  direct DB write (script, SQL) is therefore invisible on the public site until the tag is busted —
  i.e. until an admin presses **Save** on `/admin/pages/home` (`revalidatePage("home")`).
- **owners** (as shipped by `docs/specs/owners-admin-editor.md`, 2026-10-11; `src/slices/pages/schemas/owners.ts`).
  Same notation as home. Every field the spec added is optional and blank-tolerant, so rows saved
  before it still validate (no migration, no backfill). **Hidden** = tagged `.meta({ admin_hidden: true })`:
  kept in `data` and saved back unchanged, but not shown in the editor (button targets are decided in code).

  | Path | Type | Class | Blank / absent → |
  |---|---|---|---|
  | `seo?.meta_title?` / `seo?.meta_description?` | ≤70 / ≤200 (`seoShape`) | T | i18n `pages.owners.metaTitle` / `metaDescription` |
  | *(column)* `og_image_media_id` | image | C | no OG override |
  | `hero.image_media_id` | `"" \| uuid`, image (**optional** since the spec) | C | stock Unsplash photo |
  | `hero.headline` / `hero.copy` | ≤160 (`;` = line break) / ≤600, **required** | T | — |
  | `hero.contact?{label? ≤40, title? ≤80, intro? ≤280}` | button + contact dialog | T | i18n `pages.owners.contactLabel` / `contactTitle` / `contactIntro` |
  | `earnings_form{badge?, headline, subheadline?, cta_label, note?}` | step 1 of the form card | T | — |
  | `earnings_form.contact_step?{title? ≤120, lede? ≤280, submit_label? ≤60, back_label? ≤30}` | step 2 | T | i18n `pages.estimateForm.contactTitle` / `contactLede` / `submit` / `back` |
  | `earnings_form.done_step?{title? ≤120, body? ≤400}` | step 3 | T | i18n `pages.estimateForm.doneTitle` / `doneBody` |
  | `stats` | **0–8** × `statFigure` (was exactly 4; drizzle 0009 rows stay valid) | `label` T · rest C | **no rows → no band** (anchor `#numbers` kept) |
  | `why{headline, subheadline?, benefits[×6]{icon_key,title,description}, cta_primary, cta_secondary}` | CTAs = `{label, url, note?}`, **`url` hidden** | text T · icon/url C | — |
  | `services` / `dashboard` `{headline, subheadline?, benefits[×4], cta{label, url, note?}}` | **`cta.url` hidden** | text T · icon/url C | — |
  | `services.image_media_id` / `dashboard.image_media_id` | `"" \| uuid`; image (incl. animated WebP), MP4/WebM or Lottie (`optionalAnimated`) | C | stock photos |
  | `services.badge?` / `dashboard.badge?` `{label? ≤120, icon_key?}` | floating badge on the media | label T · icon C | i18n `pages.owners.servicesBadge` / `dashboardBadge`; default icon |
  | `plans{headline, subheadline?, tiers[1..4], helpers[×1]{title, copy, cta?{label, url}}}` | **`helpers[0].cta.url` hidden** | text T · url C | — |
  | `plans.tiers[]{name, tag?, commission?, corner_badge? ≤12, is_popular, features[1..20]}` | **`commission` hidden** (never rendered; the visible % is `corner_badge`) | text T | — |
  | `plans.popular_label?` ≤30 / `plans.choose_label?` ≤60 (`{name}` = tier name) | pill / tier buttons | T | i18n `pages.owners.popular` / `choosePlan` |
  | `journey{headline, subheadline?, steps[×5]{title, description, image_media_id}}` | step image `"" \| uuid`, 3:4 | text T · image C | stock Pexels photos |
  | `testimonials?.title?` ≤160 | heading only | T | i18n `pages.reviews.title` |
  | `faq_group_key?` / `faq?.title?` ≤160 | group key / heading | C / T | no FAQ / i18n `pages.owners.faqTitle` |
  | `final_cta?{eyebrow? ≤60, headline? ≤160, body? ≤600, cta_label? ≤80, contact_line? ≤200, image_media_id?}` | closing band; image only (4:5) | text T · image C | i18n `pages.owners.finalEyebrow` / `finalTitle` / `finalCopy` / `finalCta`; contact line built from **company_settings** (`Call {phone} · email · WhatsApp …`); stock photo |

  → Composed, not stored: testimonial cards = **testimonials** (owner + guest mixed); FAQ questions
  = **faq** (group `owners`, drizzle 0004→0008); closing contact line fallback = **company_settings**.
  The estimate form's field labels/placeholders/checkboxes are fixed i18n (`pages.estimateForm.*`) and the
  form does not send leads yet (`lead.kind='earnings_estimate'` pending). Button targets are fixed in
  code (`#worth`, `#start`, `#` for the plan buttons, the "Not sure" band and T&C/Privacy).
  → Stats are **per-page** (not company_settings): the displayed value is `prefix + (grouped) to + suffix`
  and the client counter animates up to `to` (drizzle 0009).
  → Same language rule (D1) and caching as home: EN only until the per-locale tabs exist; `getOwnersPage`
  is tagged `page:owners`, busted by Save on `/admin/pages/owners`.
  → History: drizzle 0004→0010 restored/restyled the sections (eyebrows dropped, hero badge moved into the
  form, Editorial-Split `why`, Image-Showcase `services`/`dashboard`, plans ≤4, one helper band); spec
  `owners-admin-editor` (2026-10-11) added every optional field above and the hidden fields.
- **real_estate** (as shipped by `docs/specs/real-estate-admin-editor.md`, 2026-10-11;
  `src/slices/pages/schemas/real-estate.ts`). Same notation as owners. Every field the spec added is
  optional and blank-tolerant (no migration, no backfill). **Hidden** = `admin_hidden` (kept and saved
  back unchanged, not shown in the editor; button targets are decided in code).

  | Path | Type | Class | Blank / absent → |
  |---|---|---|---|
  | `seo?.meta_title?` / `seo?.meta_description?` | ≤70 / ≤200 (`seoShape`) | T | i18n `pages.realEstate.metaTitle` / `metaDescription` |
  | *(column)* `og_image_media_id` | image | C | no OG override |
  | `hero.image_media_id` | `"" \| uuid`, image (**optional** since the spec) | C | stock Unsplash photo, alt i18n `pages.realEstate.heroAlt` |
  | `hero{headline ≤160, subheadline? ≤280, positioning ≤600}` | required except `subheadline` | T | — |
  | `hero.capability_statement_media_id?` | `"" \| uuid`, **document (PDF only)** | C | button 2 → `#deal-enquiry` |
  | `hero.cta_primary` / `cta_secondary` `{label ≤80, url}` | **`url` hidden** | label T · url C | — (targets: `#deal-enquiry` / the PDF) |
  | `partners{headline, subheadline?, benefits[×4]{icon_key,title,description}, cta_primary, cta_secondary}` | CTAs `{label, url, note?}`; **`url` hidden**, **`cta_secondary.note` hidden** (never rendered) | text T · icon/url C | — (targets `#deal-enquiry` / `#deal-structures`) |
  | `capabilities{headline, subheadline?, benefits[×3], cta{label, url, note?}}` / `asset_management{… benefits[×6] …}` | **`cta.url` hidden** | text T · icon/url C | — (target `#deal-enquiry`) |
  | `capabilities.image_media_id` / `asset_management.image_media_id` | `"" \| uuid`; image (incl. animated WebP), MP4/WebM or Lottie (`optionalAnimated`, 4:5) | C | stock photos, alts i18n `pages.realEstate.capabilitiesAlt` / `assetsAlt` |
  | `deal_structures{headline, subheadline?, models[×3]{name, tagline, featured, feature_label? ≤40, points[3..10]}, note?}` | | text T · `featured` C | featured card without label → i18n `pages.realEstate.featuredModel` |
  | `market{headline, subheadline?, stats[×3]{value,label}, fundamentals{title, body[×2]}, regulatory{title, body}, thesis{title, points[3..8]}}` | | T | — |
  | `track_record{headline, subheadline?, tiles[3..6]{value, label, caption?}}` | count-up derived from `value` | T | — |
  | `process{headline, subheadline?, cta{label}, steps[3..8]{title, description}}` | step numbers from order | T | — |
  | `faq_group_key?` / `faq?.title?` ≤160 | group key / heading | C / T | no FAQ / i18n `pages.realEstate.faqTitle` |
  | `deal_enquiry?{headline? ≤160, lede? ≤600, contact_title? ≤120, submit_label? ≤80, note? ≤200}` | closing `#deal-enquiry` copy | T | i18n `pages.realEstate.enquiryTitle` / `enquiryLede` / `enquiryContactTitle`; `pages.dealEnquiryForm.submit` / `note` |

  → Composed, not stored: FAQ questions = **faq** (group `real_estate`); enquiry contact lines
  (email, phone, LinkedIn) = **company_settings** (`email`, `phone`, `social.linkedin`; a missing value
  drops its line). The enquiry form's labels/placeholders/options are fixed i18n
  (`pages.dealEnquiryForm.*`) with stable EN option values; the form does **not** send yet
  (`lead.kind='deal_enquiry'` pending).
  → Same language rule (D1) and caching as home: EN only until the per-locale tabs exist;
  `getRealEstatePage` is tagged `page:real_estate`, busted by Save on `/admin/pages/real_estate`.
  → History: capabilities / deal structures / market / track record / process became DB-driven with
  canonical defaults (`defaultCapabilities`, …, `scripts/backfill-real-estate-sections.ts`); spec
  `real-estate-admin-editor` (2026-10-11) added every optional field above, the hidden fields and the
  `document` media kind.
- **about** (as shipped by `docs/specs/about-admin-editor.md`, 2026-10-16;
  `src/slices/pages/schemas/about.ts`). Base shape (session 3d):
  `hero{image_media_id?, eyebrow, headline, mission}`; `story{eyebrow, headline, narrative[×3], image_media_id?}`;
  `stats[×5]{value,label}`; `serve{eyebrow, headline, intro, audiences[×3]{icon_key,title,description,image_media_id?}}`;
  `values{eyebrow, headline, intro, items[×4]{title,description}}`;
  `organisation{eyebrow, headline, intro, badge, image_media_id?, departments[×6]{icon_key,name,description}}`;
  `certifications{eyebrow, headline, intro, items[1–12]{icon_key,logo_media_id?,logo_alt?,title,issuer,description}}`;
  `community{eyebrow, headline, copy[×2], image_media_id?}`;
  `contact{eyebrow, headline, cards[×3]{icon_key,title,description,link_label}, office_title, office_labels?, form{headline,subheadline}}`
  (card destinations fixed by position: buildings / owners / real estate; form → `lead.kind='contact'`).
  Fields the about spec added — all optional and blank-tolerant (no migration on `page_content`, no
  backfill); the only type change is `certifications.items` `fixed(3)` → `between(1, 12)`, compatible
  with the stored 3 rows:

  | Path | Type | Class | Blank / absent → |
  |---|---|---|---|
  | `seo?.meta_title?` / `seo?.meta_description?` | ≤70 / ≤200 (`seoShape`) | T | i18n `pages.about.metaTitle` / `metaDescription` (EN = the route's former literals) |
  | *(column)* `og_image_media_id` | image | C | no OG override |
  | `hero` / `story` / `organisation` / `community` `.image_alt?` | ≤160, one per photo | T | i18n `pages.about.alts.<section>` (the asset's own alt is not used) |
  | `certifications.items` | **1–12** rows (was fixed 3) | — | — |
  | `certifications.items[].logo_media_id` | `"" \| uuid`, image (PNG; SVG not accepted) | C | the row's icon (the external default logos were removed) |
  | `certifications.items[].logo_alt?` | ≤160 | T | the row's `issuer` |
  | `faq_group_key?` / `faq?.title?` ≤160 | group key / heading | C / T | no FAQ / i18n `pages.faqTitle` |
  | `contact.office_labels?{address?, bookings?, checkin?, email?, website?}` | ≤40 each | T | i18n `pages.about.office.<key>` |

  Blank images fall back to the mock photos. The 3 audience cards are CSS backgrounds (no alt).
  → Office block values = **company_settings** (address, bookings phone, `checkin_phone`, email,
  `website_url`, hours + label); a blank check-in phone or website hides its row.
  Team/departments, partners, certifications, stats, "founded 2012" are **static copy here** — no entities.
  → Same language rule (D1) and caching as home: EN only until the per-locale tabs exist;
  `getAboutPage` is tagged `page:about`, busted by Save on `/admin/pages/about`.
  → PROD (2026-10-16): rows 1–2 of `certifications.items` hold the ALEP and Turismo de Portugal
  logos as R2 assets (uploaded through the admin); no photos, OG image or FAQ group set yet.
- **guest** (as shipped by `docs/specs/guests-admin-editor.md`, 2026-10-12;
  `src/slices/pages/schemas/guest.ts`). Same notation as owners. Base shape wired to the front in
  drizzle 0012 (`docs/specs/guest-page-db-wiring.md`); every field the guests spec added is optional
  and blank-tolerant (no migration, no backfill). **Hidden** = `admin_hidden` (kept and saved back
  unchanged, not shown in the editor, **unused by the render**: every button target is fixed in code,
  locale-relative — `/{locale}/buildings`, `/services`, `/guides`; the owner button opens the contact dialog).

  | Path | Type | Class | Blank / absent → |
  |---|---|---|---|
  | `seo?.meta_title?` / `seo?.meta_description?` | ≤70 / ≤200 (`seoShape`) | T | i18n `pages.guests.metaTitle` / `metaDescription` |
  | *(column)* `og_image_media_id` | image | C | no OG override |
  | `hero{eyebrow? ≤80, headline ≤160, subheadline? ≤280}` | | T | — |
  | `hero.video_media_id` | `"" \| uuid`, video (MP4/WebM; `<source type>` from the mime) | C | stock clip |
  | `hero.poster_media_id?` | `"" \| uuid`, image (Home's poster hint) | C | stock Unsplash poster |
  | `hero.cta{label ≤80, url}` | **`url` hidden** | label T · url C | — (target `/{locale}/buildings`) |
  | `welcome{headline ≤160, lede ≤400, copy ≤1200, guarantee_label? ≤120}` | `copy` split into paragraphs on blank lines | T | guarantee line omitted |
  | `welcome.guarantee_icon_key` | `"" \| icon key` | C | `percentage-circle` |
  | `welcome.image_media_id` | `"" \| uuid`; image (incl. animated WebP), MP4/WebM or Lottie (`optionalAnimated`, 3:2) | C | stock Unsplash photo |
  | `welcome.image_alt?` | ≤160 | T | the asset's alt → i18n `pages.guests.welcomeAlt` |
  | `why{eyebrow?, headline, intro?, benefits[×4]{icon_key,title,description}, cta{label, url, note?}}` | **`cta.url` hidden** | text T · icon/url C | — (target `/{locale}/buildings`) |
  | `portfolio{eyebrow?, headline, intro?, cta{label, url, note?}}` | headings/CTA only; **`cta.url` hidden**; `cta.note` now rendered | T | no note (target `/{locale}/buildings`) |
  | `services_teaser` / `activities_teaser` `{eyebrow?, headline, intro?, items[×6]{icon_key, title, description, image_media_id?}, cta{label, url, note?}}` | card photo `"" \| uuid` image (3:2); **`cta.url` hidden** | text T · icon/image/url C | the Pexels photo at that position (targets `/{locale}/services` / `/{locale}/guides`) |
  | `testimonials?{eyebrow? ≤60, title? ≤160, intro? ≤400}` | heading only | T | i18n `pages.reviews.eyebrow` / `titleGuests`; no intro |
  | `faq_group_key?` / `faq?.title?` ≤160 | group key / heading | C / T | no FAQ / i18n `pages.faqTitle` |
  | `dual_cta.{guest,owner}{eyebrow? ≤60, title ≤160, body ≤400, cta{label, url}}` | panel copy; **`cta.url` hidden** | text T · url C | — (guest → `/{locale}/buildings`; owner → contact dialog) |
  | `dual_cta.owner.contact?{title? ≤80, intro? ≤280}` | copy of the dialog the owner button opens | T | i18n `settings.contactDialog.title` / `intro` |

  → Composed, not stored: featured portfolio = **buildings**; reviews = **testimonials**
  (audience=guest, managed in `/admin/testimonials`; only the heading is stored here); FAQ questions =
  **faq** via `faq_group_key`; dual-CTA contact line = **company_settings**. The owner button's lead is
  `lead.kind='contact'`, `source_page='guests-dual-cta'`.
  → Same language rule (D1) and caching as home: EN only until the per-locale tabs exist;
  `getGuestPage` is tagged `page:guest`, busted by Save on `/admin/pages/guest`.
  → History: drizzle 0012 wired the page to the DB (with `localizeUrl` rewriting the stored absolute
  `/en/…` URLs — removed by the guests spec); spec `guests-admin-editor` (2026-10-12) added every
  optional field above and the hidden URLs.

- **blog** (drizzle 0016): `post_aside{eyebrow?, title, body?, cta_label}` — the CTA under the
  "In this article" TOC of every post. Destination fixed in code (locale `/owners`); a post's own
  `cta_label`/`cta_url` replaces the button. No FAQ, no OG override in use.
- **guides** (drizzle 0016): `guide_aside{image_media_id?, eyebrow?, title, body?, cta_label}` — the
  accommodation CTA under the "In this guide" TOC of every guide. Destination fixed in code (locale
  `/buildings`); a blank image shows the mock photo.

- **buildings** (as shipped by `docs/specs/buildings-admin-editor.md`, 2026-10-11;
  `src/slices/pages/schemas/buildings.ts`). The editable sections of the Buildings **listing**
  (`/<locale>/buildings`), rendered inside slice `buildings`' listing through the `pages` contract.
  Not the detail page `/buildings/[slug]` (it reads nothing from this row). Same notation as home.
  Every text field is optional and blank-tolerant; blank → `pages.buildings.*` i18n (EN = the
  literals the page showed before the spec). No editable URLs.

  | Path | Type | Class | Blank / absent → |
  |---|---|---|---|
  | `seo?.meta_title?` / `seo?.meta_description?` | ≤70 / ≤200 (`seoShape`) | T | i18n `pages.buildings.metaTitle` / `metaDescription` |
  | *(column)* `og_image_media_id` | image | C | no OG override |
  | `hero?.image_media_id` | `"" \| uuid`, image 16:9 | C | stock Unsplash photo |
  | `hero?{eyebrow? ≤60, headline? ≤160, copy? ≤600}` | hero texts | T | i18n `pages.buildings.heroEyebrow` / `heroTitle` / `heroCopy` |
  | `hero?.contact?{label? ≤40, title? ≤80, intro? ≤280}` | button + contact dialog | T | i18n `pages.owners.contactLabel` / `contactTitle` / `contactIntro` |
  | `owner_panel?{eyebrow? ≤60, title? ≤160, body? ≤400, cta_label? ≤80}` | "For Owners" panel; button fixed to `#estimate` | T | i18n `pages.buildings.ownerEyebrow` / `ownerTitle` / `ownerBody` / `ownerCta` |
  | `owner_panel?.contact_line?` ≤200 | panel contact line | T | built from **company_settings** (`Call {phone} · email · WhatsApp …`, as Owners' closing CTA) |
  | `stats?.title?` ≤160 | band heading | T | i18n `pages.buildings.statsTitle` |
  | `stats?.figures` | **0–8** × `buildingsFigure` = `statFigure` + `description?` ≤120 | `label` / `description` T · number and affixes C | **no rows → no band** (heading included) |
  | `calculator?{badge? ≤60, headline? ≤160, subheadline? ≤280, cta_label? ≤80}` | step 1 of the wizard | T | i18n `pages.buildings.calcBadge` / `calcTitle` / `calcSubtitle` / `calcCta` |
  | `calculator?.contact_step?` / `done_step?` | same shapes as owners `earnings_form` (`estimateContactStep` / `estimateDoneStep`, `_shared.ts`) | T | i18n `pages.estimateForm.*` |
  | `calculator?.media_media_id` | `"" \| uuid`; image (incl. animated WebP), MP4/WebM or Lottie (`optionalAnimated`), 4:5 | C | stock Pexels photo |

  → Composed, not stored: building cards = **buildings** (`listBuildings`, edited in
  `/admin/buildings`); panel contact line fallback = **company_settings**; the estimate form's field
  labels/placeholders are fixed i18n (`pages.estimateForm.*`) and it does not send leads yet.
  → Row created by **drizzle 0017** (data only, `ON CONFLICT DO NOTHING`) with `defaultBuildings`:
  blank texts + the three figures the page always showed (400,000+ / 12+ / €55M+ with their labels and
  descriptions). Without the row the page still renders (`getBuildingsPage` falls back to
  `defaultBuildings`), but the editor would open with 0 figures and the first Save would hide the band.
  → Same language rule (D1) and caching as home: `getBuildingsPage` is tagged `page:buildings`, busted
  by Save on `/admin/pages/buildings` (`revalidatePage` → `/{locale}/buildings` ×4).

**FAQ (all five pages).** Every page's `data` carries an optional **`faq_group_key`** (blank/absent =
no FAQ). When set, it holds the language-neutral `key` of a `faq_group` (faq slice); the page renders
that group through the shared `FaqSection` (accordion + `FAQPage` JSON-LD). The page editor surfaces it
as a **dropdown** populated from `faq.listFaqGroups` (so any group created in `/admin/faq` is pickable).
The key is **not** a [T] field. Owners + Real-Estate, whose FAQs were previously hard-coded page markup,
are seeded in drizzle 0008 (`owners` / `real_estate` groups, from the former static Q&A) and bound by
default; Home/Guest/About start blank.

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
  og_image_media_id?, price_from? (cents), rating_tenths? (integer tenths, 0–50 → 0.0–5.0; ADR 0032),
  duration_label?, booking_type (enquiry|external|none), cta_label?, cta_url?`. **[T]**: `name`, `excerpt`, `body` (rich), `price_suffix?` (e.g. "/ person"), `detail?`, `meta_title`, `meta_description`.
  - **`detail`** (portable JSON, one [T] field like the blog body — ADR 0013; schema in
    `src/slices/services/detail.ts`): a **fixed-shape object**, not an ordered block list, because the
    detail template's section order is designer-owned — `highlights[]`, `itinerary[]{time,title,text}`,
    `option_groups[]{title, items[]{name, desc?}}`, `pricing{columns[], rows[]{label, cells[]}, footnote?} | null`
    (one cell per column), `extras[]{label, price, desc}`, `partners[]{name, desc, cta_label, url}`, `notes[]`.
    Each section renders only when non-empty; prices inside it are display text, not `price_from`.
    No column and no migration: it lives in `translation` (entity_type='service', field='detail').
- **service_category**: `id, slug, icon, position`. **[T]** `name`. (Seed from mockup tags: Arrival,
  Day Trip, On the Water, Experience, At Home, Convenience, Family.)
- **service_media**: `service_id, media_id, position` (gallery).
  - *Public contract:* `ServiceSummary` (incl. `rating`, tenths already divided), `ServiceDetail`,
    `listServices(category?)`, `getBySlug`. Consumed by the services pages **and** the home services
    carousel (slice `pages`, ADR 0032).
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
  `checkin_phone text?` and `website_url text?` (an `https://` URL) — drizzle **0018**
  (`0018_settings_checkin_website.sql`, additive, seeded with `COALESCE` to `+351 912 310 632` /
  `https://www.centralhill.pt`; applied in PROD 2026-10-16), spec `about-admin-editor` S3. Read as
  `SiteGlobals.checkinPhone` / `website` (blank → `null`); the About office panel hides a null row.
- **nav_item**: `id, location (header|footer), parent_id?, position, url`. **[T]** `label`. Covers the
  primary nav, the two persistent CTAs (Book Now / List Your Property), and footer link columns.
  - Tag: `globals`, `nav` — revalidated site-wide on change.

### Slice `media` (kernel-adjacent, owned by `core/media` + thin admin)
- **media_asset**: `id, r2_key, mime, width, height, blurhash?, credit?`. **[T]** `alt`. (Video assets
  for heroes are referenced the same way; the player/poster is chosen by mime in the UI.)
  Three kinds by `mime` (spec home-admin-editor S6): **image** (`image/jpeg|png|webp|avif`; an
  animated WebP is stored as uploaded, `width`/`height` = one frame), **video** (`video/mp4|webm`,
  no dimensions/blurhash) and **Lottie** (`application/json` for `.json`, `application/zip+dotlottie`
  for `.lottie`; `width`/`height` = the animation canvas when readable, no blurhash). There is no
  "animated" flag on the row.

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
