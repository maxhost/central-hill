# Slice `services` (S5)

Guest **services & experiences** — a public **index + detail** catalog (transfers, day
trips, chef at home, etc.). See `docs/vertical-slices.md` → S5, `docs/data-model.md` →
Slice services.

## Owns

**Tables** (`schema.ts`, migration `0000`):
- `service` — `slug, status, position, category_id→service_category, cover_media_id,
  og_image_media_id?, price_from? (cents), duration_label?, booking_type
  (enquiry|external|none), cta_label?, cta_url?`. [T]: `name, excerpt, body, duration_label,
  cta_label, meta_title, meta_description`.
- `service_category` — `slug, icon, position`. [T]: `name`.
- `service_media` — `service_id→service, media_id, position` (gallery). No [T].

`cover_media_id` / `og_image_media_id` / `service_media.media_id` are loose uuids →
`media_asset` (core/media), resolved via that kernel module, never by querying its table.

## Routes (App Router, ISR)

- `/[locale]/services` — index: hero + category-filtered card grid + "how it works" +
  CTA band. `revalidate = 3600`, static per locale.
- `/[locale]/services/[slug]` — detail: hero, body, gallery, booking-type-aware CTA.
  `generateStaticParams` from `listServiceParams()`; `dynamicParams = true`.

## Contract (`contract.ts`)

Types: `ServiceSummary`, `ServiceDetail`, `ServiceCategoryRef`, `ServiceBookingType`.
Reads: `listServices(locale, categorySlug?)`, `getServiceBySlug(locale, slug)`,
`listServiceCategories(locale)`, `listServiceParams()`.
Cache tags: `SERVICE_TAGS.list` = `service-list`, `SERVICE_TAGS.service(id)` (reserved for
a future targeted bust).

All reads are `unstable_cache`-wrapped (keyed by locale, + category/slug) and tagged so a
publish busts them. **S9 pages that embed a services teaser should add `SERVICE_TAGS.list`
to their own cached reads' tags** so a services publish cascades.

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

## Deferred (not in this slice's first cut)

- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12** — service form,
  category manager, gallery ordering, translation review.
- **Category icons**: `service_category.icon` holds iconoir keys but the icon font is not
  yet loaded in the app shell; the UI shows category name chips. Render the glyphs once the
  icon set is wired (kernel/app-shell change → ADR).
- **Service/Offer JSON-LD**: only `BreadcrumbList` is emitted; a richer `Service`/`Offer`
  builder belongs in `core/seo` (**S13**, ADR — golden rule 3), not hand-written here.

## Tests

`tests/services.test.ts` — service / category / media input validation + the
translatable-path contract. Run: `npx tsx --test src/slices/services/tests/services.test.ts`.
