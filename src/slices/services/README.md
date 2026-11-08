# Slice `services` (S5)

Image descriptions are edited beside the cover, gallery, social image and nested
itinerary pickers in each locale tab. `ServiceContent.media_alts` is optional,
localized JSON keyed by media UUID; it follows the existing inherit/custom and
Save draft/Publish lifecycle. Image IDs remain shared. Readers use only the chosen
locale's published descriptions, then the existing asset/name fallback when blank;
legacy asset translations are never edited by these controls (ADR0076).

Service booking cards omit the Ask on WhatsApp button. Its legacy whatsappCta
override is hidden/preserved in BO; the primary request/booking action remains.

Service details omit the small labels About this service/experience, What's
included, Options, Rates, Our Partners, Good to know, Add This to Your Stay and
More Ways We Can Help. Their copy overrides remain compatible in stored data
but SERVICE_HIDDEN_COPY_KEYS excludes them from general/section BO controls.
Main section titles/content and itinerary labels remain available.

Service detail headers omit the category eyebrow. Categories remain assigned
through the service BO and visible on listing-card labels; category data and
management are preserved.

Service details now show at most four photos in their header mosaic: cover as
the large left tile, first gallery photo across the top right, next two below.
Missing positions now use temporary Pexels samples (later user request); uploaded
photos replace them automatically. Extras remain in Show all photos; temporary
samples are never saved to the database or included in that dialog.
The BO media section labels the cover/gallery roles and all four positions,
retaining its image upload/removal and gallery reorder controls. No additional
photos are required to save old services. See `docs/specs/service-four-photo-mosaic.md`.

Guest **services & experiences** — a public **index + detail** catalog (transfers, day
trips, chef at home, etc.). See `docs/vertical-slices.md` → S5, `docs/data-model.md` →
Slice services.

## Owns

**Tables** (`schema.ts`, migration `0000`):
- `service` — `slug, status, position, category_id→service_category, cover_media_id,
  og_image_media_id?, price_from? (cents), rating_tenths? (migration `0014`), duration_label?,
  booking_type (enquiry|external|none), cta_label?, cta_url?`. `rating_tenths` is the partner
  score in **integer tenths** (0–50 → 0.0–5.0), null when unrated; the contract exposes it as
  `rating: number | null`, already divided (ADR 0032). [T]: `name, excerpt, body, duration_label,
  cta_label, meta_title, meta_description`.
- `service_category` — `slug, icon, position`. [T]: `name`.
- `service_media` — `service_id→service, media_id, position` (gallery). No [T].

`cover_media_id` / `og_image_media_id` / `service_media.media_id` are loose uuids →
`media_asset` (core/media), resolved via that kernel module, never by querying its table.

## Routes (App Router, ISR)

- `/[locale]/services` — React composition of the Pages contract's editable editorial
  sections (hero, catalogue introduction and closing CTA), around
  this slice's published service cards. Edit page copy, icons, media/posters and SEO at
  `/admin/pages/services`; catalogue cards and categories stay in this slice's admin.
  Blank overrides preserve `services.*` messages and Settings icons/contact details.
  Reads retain `service-list`, `page:services` and Settings cache dependencies.
  The catalogue intro eyebrow and complete How It Works section were removed
  from public output and BO; legacy content remains hidden/preserved in Pages.
- `/[locale]/services/[slug]` — detail (`ui/service-detail.tsx`): the approved
  `mock/service-detail.html` — ONE fixed skeleton for every service — fully componentised (no
  `.mk`/`mock.css`) and **DB-driven** via `getServiceBySlug(locale, slug)`:
  title block (`core/ui` `DetailTitle`: breadcrumb, category eyebrow, name, excerpt, ★ rating +
  "Guest favourite" ≥ 4.8, badges) → gallery (`core/ui` `MosaicGallery adaptive`, cover +
  gallery, count-aware 1–4 layouts; "Show all photos" dialog `ServicePhotos` only for 5+) →
  body grid: content column of `core/ui` `ContentBlock`s (key facts `IconFactGrid`, About,
  What's included, the **variable module** — itinerary `ServiceItinerary` (thumbnails from
  `stepImages` or the step number) → option groups `ServiceOptionGroups` (cards / chips) →
  rates `ServiceRates` (table + footnote + extras) → partners `ServicePartners` — and Good to
  know `ServiceGoodToKnow`, each only when non-empty) beside the sticky `ServiceBookingCard`
  (in `core/ui` `StickyAside`; actions by `booking_type`: `enquiry` → "Request…" `#enquire` +
  "Ask on WhatsApp" + no-payment note, `external` → the CTA in a new tab, `none` → "See
  partners" when partners exist) → `ServiceMobileBar` (≤980px) → enquiry (`enquiry` only:
  `core/ui` `EnquirySplit` on the `alt` band + leads `ContactForm`, `source="service:<slug>"`)
  → "Other guest services" (4 → 2 → 1 grid of the listing's own `ServiceCard`, max 4). Every icon
  is `core/ui` `<Icon>` (inline Iconoir SVG, ADR 0034); `detail.facts[].icon` is the closed
  `FACT_ICONS` enum of Iconoir names (legacy `pin` is read as `map-pin`).
  Copy: `services.detail.*` messages. `generateStaticParams` = `listServiceParams()`; unknown
  slugs 404; `revalidate = 3600`, reads tagged `service-list`.

## Contract (`contract.ts`)

Types: `ServiceSummary`, `ServiceDetail`, `ServiceCategoryRef`, `ServiceBookingType`.
Reads: `listServices(locale, categorySlug?)`, `getServiceBySlug(locale, slug)`,
`listServiceCategories(locale)`, `listServiceParams()`.

Cache tags: `SERVICE_TAGS.list` = `service-list`, `SERVICE_TAGS.service(id)` (reserved for
a future targeted bust).

All reads are `unstable_cache`-wrapped (keyed by locale, + category/slug) and tagged so a
publish busts them. **S9 pages that embed a services teaser should add `SERVICE_TAGS.list`
to their own cached reads' tags** so a services publish cascades. The home services carousel
(S9 `pages`, ADR 0032) consumes `listServices` + `listServiceCategories` this way — it reads
no table of this slice and authors no service copy of its own.

### Booking type → CTA

`booking_type` routes the detail CTA: `external` → `cta_url` (e.g. a partner page);
`enquiry` → renders a "booked through your guest contact" panel (the guest contact path is
owned by S9/leads — wired there, not here); `none` → display only. `price_from` is integer
cents; the UI formats it as EUR (`company_settings.currency` is fixed to `"EUR"`), so this
slice needs no settings dependency.

## i18n

UI chrome → `services` namespace in `messages/{en,pt,es,fr}.json` (all 4 authored): hero,
grid headings, filter "all", how-it-works, CTA band, price label, breadcrumb. DB content
([T] fields) resolves through `core/i18n` with the source-locale (`en`) fallback +
`approved`-only gating. The detail `body` is plain rich text rendered as paragraphs.

## Revalidation (`server/publish.ts`)

`revalidateServices()` — the single place that busts the `service-list` tag (listing,
detail, categories and any S9 teaser subscribe to it). Called by the services admin actions
(S12).

## Backoffice (`admin/`) — category manager + service CRUD (S12)

Plugs into the backoffice shell. Contributes two `content`-group screens
(`admin/screens.ts` → `servicesAdminScreens`): "Services" (order 20) with
"Service categories" as its submenu on service and category routes. Lists + editors mount under
`app/(admin)/admin/(panel)/{service-categories,services}/…`.

- `admin/validation.ts` — `serviceCategorySaveInput` (slug/icon/position + [T] name) and
  `serviceSaveInput` (the editor's post shape: `id?`, nullable optionals, `min(1)` on
  required [T] name/excerpt/body, `price_from` integer cents, `rating_tenths` bounded to
  0–50, gallery riding along). The form takes the rating as "4.7" (comma accepted) and
  converts it to tenths on submit.
- `admin/queries.ts` (server-only) — `listServiceCategoriesAdmin` / `getServiceCategoryForEdit`
  / `listServiceCategoryOptions` (for the service selector) and `listServicesAdmin` /
  `getServiceForEdit` (source values + media previews). Not cache-wrapped.
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — `saveServiceCategory`
  (plain-column slug; [T] name via the seam) / `deleteServiceCategory` (refuses while a
  service still references it — RESTRICT FK), and `saveService` (service slug via the
  `core/i18n` write seam, ADR 0019; source [T] name/excerpt/body/duration/cta/meta through
  the same seam; gallery replaced) / `deleteService` (cascades `service_media`, cleans
  translations + slugs). All bust `service-list` via `revalidateServices`.
- `admin/ui/` — `category-list`/`category-form` and `list`/`service-form` (client islands;
  the service form gates the CTA fields on `booking_type` and uses the media pickers).

## Conditional detail editor contract (migration 0019)

`service.presentation` is nullable JSONB, validated by `presentation.ts`: version 1,
independent section flags, price display mode and seven optional Iconoir overrides.
Absent flags retain content-driven visibility; false hides without deleting content.
Public `detail` is filtered after resolving localized text; admin always loads full data.
`ServiceSummary.priceDisplay` is resolved separately from the stored `priceFrom` value.
The listing and Home carousel still do not render prices.

`copy.ts` defines 38 optional per-service text overrides, stored as scalar translatable
fields `copy:<key>` through the i18n seam. The generic translation inbox discovers them
from source rows. Reads validate each field and fall back independently. About/Included
titles and primary CTA label retain their existing fields to avoid duplicate sources.

Save validates effective presentation, media and stored integrity before writes. Existing
staff IDs are attributed through the kernel's additive text column (ADR0036/migration0020),
with UUID compatibility retained. Both normal textual and UUID users can save. Invalid stored JSON blocks
ordinary saves instead of being silently replaced with an empty detail.

Local implementation independently QA-approved on `9faffe9`; execution/QA/handoff under
`docs/specs/service-detail-editor-*` and `handoff-service-detail-editor.md`.

## Deferred

- **Service/Offer JSON-LD**: only `BreadcrumbList` is emitted; a richer `Service`/`Offer`
  builder belongs in `core/seo` (**S13**, ADR — golden rule 3), not hand-written here.

## Demo catalogue

`scripts/seed-services.ts` writes 3 categories + 9 published services with real cover photos,
pushed through the production upload path (presign → PUT to R2 → finalize) so every row has true
dimensions and a blurhash. Idempotent by slug; a cover is only re-fetched when the seed names a
different photo, tracked via `media_asset.credit`. Run:
`pnpm tsx --tsconfig scripts/tsconfig.json scripts/seed-services.ts` (`DRY=1` to report only).

## Tests

`tests/services.test.ts` — service / category / media input validation + the
translatable-path contract. `tests/services-admin.test.ts` — the admin save schemas. Run:
`npx tsx --test src/slices/services/tests/services.test.ts src/slices/services/tests/services-admin.test.ts`.

## Common Pages editorial integration

`ServicesListingRenderer` accepts optional injected Pages content and private preview
annotations; the public listing uses the same renderer and retains slice catalogue queries.
Editorial draft/publish lives in Pages, while individual entity workflows remain here.


## Service language forms (ADR0065 / migration0027)

The existing create/edit form has EN/ES/PT/FR workspaces, explicit per-language
Save draft and Publish, English inheritance until the first actual localized edit,
and protected local unsaved work. Locale snapshots live in service_locale_content;
live common data lives in service_shared_content. A read-only GET projects legacy
content without backfilling. First mutation preserves historical publications,
raw pending translations, localized slugs and retired copy overrides. New identities
are unpublished until a language is explicitly published. Public listing/detail,
metadata, Home consumers and static params use actual published locale snapshots.

Cover/gallery/OG and nested itinerary photos are common. Category and icons are
chosen in English; all tabs use one selected identity. Facts/itinerary carry stable
optional JSON ids, preserving legacy ordinal slots once and new UUIDs thereafter;
shared nested maps join by id, never by current localized array position. Common
Save updates public assets and neutral values without rewriting target text or SEO.
Label/URL booking copy, duration, pricing display strings and full Service SEO stay
localized. All conditional modules and existing enquiry/external/none behavior stay.

Service categories use the existing `name` translation field: four manual inputs,
English required, blank targets fall back to English, old clients omitting target
fields preserve them. One Save approves manual target labels through existing core
seams; selectors/public cards read approved names per locale. Rename invalidates
service caches without Service republishing. Legacy direct Save rejects identities
already using locale rows. Staff-only locale actions enforce reference validation,
EN-only choices, revision CAS and graph-locked atomic locale/common writes.
Archive is reversible visibility: Save retains archive, Restore preserves drafts,
and explicit selected-language Publish reactivates the service.

Meaningful coverage: tests/service-locale-model.test.ts and
service-locales.integration.test.ts (synthetic propertylocalesqa e780 fixtures only).
Execution/permissions/results: docs/specs/service-locale-forms-execution.md.
