# Slice `services` (S5)

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

- `/[locale]/services` — index: the approved `mock/services.html` design embedded 1:1
  (`ui/services-listing.tsx`) — hero + card grid + CTA band are still static markup;
  the **"How It Works" value strip is real JSX**, `core/ui`'s new `IconFeatureGrid` (a
  centered eyebrow/heading above a fixed 3-column icon/title/description grid — see that
  component's docstring), ported 1:1 from the old `.mk`-scoped `.howstrip`/`.how-grid`/
  `.how-item` CSS and rendered **outside** `.mk` (same `.mk * {margin:0;padding:0}`
  unlayered-CSS-vs-`@layer`-Tailwind pitfall `SpecStrip`/buildings hit — see that
  component's docstring), which is why `BODY` in `services-listing.tsx` is split into
  `BODY_TOP`/`BODY_BOTTOM` around it. `revalidate = 3600`, static per locale, **no database
  read** (content is hardcoded English, same gap as the detail pages below).
- `/[locale]/services/[slug]` — detail (`ui/service-detail.tsx`): the approved
  `mock/service-detail.html` — ONE fixed skeleton for every service — fully componentised (no
  `.mk`/`mock.css`) and **DB-driven** via `getServiceBySlug(locale, slug)`:
  title block (`core/ui` `DetailTitle`: breadcrumb, category eyebrow, name, excerpt, ★ rating +
  "Guest favourite" ≥ 4.8, badges) → gallery (`core/ui` `MosaicGallery adaptive`, cover +
  gallery, count-aware 1–5 layouts; "Show all photos" dialog `ServicePhotos` only for 6+) →
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
(`admin/screens.ts` → `servicesAdminScreens`): "Service categories" (order 60) and
"Services" (order 65). Lists + editors mount under
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
