# Slice `pages` (S9)

The five **editable fixed marketing pages** — Home, Owners, Real Estate, About, and the
Guest landing — stored one row per `key` in `page_content`, each validated by a fixed
per-page Zod schema (ADR 0012 / `docs/data-model.md` → Page content model). This slice is
**pure composition**: it owns only its own page rows and resolves their [T] blocks + media,
then its UI embeds the dynamic/shared pieces through *other slices' contracts*. It holds **no
foreign tables**. See `docs/vertical-slices.md` → S9.

## Owns

**Table** (`schema.ts`, migrations `0000`, `0003`):
- `page_content` — `key (unique: home|owners|real_estate|about|guest), data jsonb
  (SOURCE-locale values, validated per `key`), og_image_media_id?`. Pages have **no
  draft/published state** (owner direction, `0003`): a row that exists is live.
  Target-locale [T] values live in the cross-cutting `translation` table with
  `entity_type='page_content'`, `field='block:<dot.path>'` (e.g. `block:owners.benefits.0.title`).

**Page schemas** (`schemas/`): one fixed Zod schema per page (`home`, `owners`, `real-estate`,
`about`, `guest`) composed from `_shared.ts` (`iconCard`, `step`, `titledItem`, fixed/range
array helpers). `schemas/index.ts` maps `key → schema` (`pageSchemas`) and derives
`translatablePathsByPage` (the [T] leaf paths the translation pipeline extracts). Repeating
groups are **fixed-count arrays** (e.g. exactly 6 benefits) — the admin form shows N slots.

## Contract (`contract.ts`)

Reads (all return `null` when the page row has not been authored):
- `getHomePage(locale)`, `getOwnersPage(locale)`, `getGuestPage(locale)`,
  `getRealEstatePage(locale)`, `getAboutPage(locale)`.

Each returns `PageResult<T> = { content, media, ogImage }`:
- `content` — the page's fixed schema with every [T] leaf resolved for the locale (approved
  target, else source `en`);
- `media` — `Record<mediaId, MediaImageData>` for every `*_media_id` referenced in `content`
  (hero videos read `.url`);
- `ogImage` — the optional social-card override.

Cache tag: `PAGE_TAGS.page(key)` = `page:<key>` (one singleton per page). Reads are
`unstable_cache`-wrapped. The **embedded** slice data (featured buildings, testimonials, faq,
settings) is fetched by the page-section components through those slices' own cached+tagged
queries, so a publish there busts the composed page automatically (Next associates a route's
full-route cache with every data-cache tag read during render) — this slice doesn't re-declare
those tags.

## UI

Page compositions (`ui/*-page.tsx`): `HomePage`, `OwnersPage`, `GuestPage`, `RealEstatePage`,
`AboutPage` — each fetches its `getXPage`, `notFound()`s when the row is missing, and lays the
page out from `content` + `media`. Shared pieces in `ui/components/`:
- presentational (`blocks.tsx`: `SectionHeading`, `FeatureGrid`, `Steps`, `CtaRow`, `Prose`,
  `Band`; `hero.tsx`: `PageHero` image/video);
- data-composing (`stats-band.tsx` → settings, `testimonials-row.tsx` → testimonials,
  `featured-portfolio.tsx` → buildings, `faq-section.tsx` → faq, `lead-cta.tsx` → settings
  contact). `dual-cta.tsx` renders the editable Home `dual_cta` block (owner/guest panel copy +
  background images) with the settings contact line; unset fields fall back to the localized
  `pages.dualCta.*` chrome and approved mock photos.

The **Owners** page (`owners-page.tsx`) is a mostly-static landing (mock embedded 1:1; the only DB
read is the shared testimonials marquee, see below): hero + earnings form, an animated "numbers" band (`owner-stats-counter.tsx` counts each figure
up on scroll, honouring `prefers-reduced-motion`), then the full marketing flow — `why` (Editorial-
Split: title + CTAs beside a hairline `benefits[×6]` list, the home owners-pitch layout reproduced
as scoped `.mk` CSS since `mock.css` styles bare `.mk` elements and would leak into the Tailwind
component), `services` and `dashboard` (#technology) — both the home **Image-Showcase** layout
(4 benefit highlights + CTA beside a 4:5 image with a floating badge; `dashboard` mirrored with the
image on the left), reproduced as scoped `.mk` CSS for the same reason — `plans` (up to 4 pricing
tiers, with extra air before the two helper blocks), `journey`, `faq` — and the closing CTA. The
`testimonials` section is the shared `<TestimonialsRow>` infinite marquee (the same component as the
home "Partners & Guests" carousel): the static body is split around it and it renders **outside** the
`.mk` wrapper so `mock.css` bare-element rules don't leak into its Tailwind markup — it is the one
piece of the page that reads the DB (testimonials slice, ISR-cached, like the home). Per owner
direction the per-section **eyebrow** labels were dropped (titles stay), the hero badge moved into the
form, and `why`/`services`/`dashboard` were restyled; the editable marketing sections (now incl.
`services.image_media_id` + `dashboard.image_media_id`, and plans capped at 4 tiers) are mirrored in
the owners schema and stored row, editor-ready (drizzle 0004→0007).

The Home `guests_pitch.image_media_id` and `dual_cta.*.image_media_id` are **optional images**
(`""` allowed): until an R2 asset is uploaded the render falls back to an approved mock photo,
so the section never renders empty.

All cross-slice data is read **through contracts only** (golden rule 2) — e.g. the featured
portfolio builds its own card from `BuildingSummary` rather than importing buildings' UI.

## Routes (`src/app/[locale]/…`)

`/[locale]` (home), `/owners`, `/guests`, `/real-estate`, `/about` — each ISR (`revalidate =
3600`), prebuilds all 4 locales, and emits canonical + `hreflang` alternates via
`buildMetadata`. Page meta titles/descriptions come from the `pages` i18n namespace; the OG
image override comes from the page row.

## i18n

UI-chrome strings live in the root `messages/<locale>.json` under the `pages` namespace
(authored for en/pt/es/fr): per-page meta, section connective labels (stats/reviews/portfolio
eyebrows), the dual-CTA copy, and plural helpers (`portfolio.apartments`, `portfolio.guests`).
All page *content* prose are [T] DB fields resolved through `core/i18n`.

## Resolution internals (`server/`)

- `overlay.ts` (pure, DB-free, unit tested): `expand` (pattern → concrete numeric paths),
  `overlayTranslations` (clone + overlay approved leaves, source fallback), `collectMediaIds`.
- `resolve.ts` (`server-only`): wraps the overlay with the `core/i18n` translation resolver
  and resolves media via `core/media`.
- `queries.ts`: the cached public reads.
- `publish.ts`: `revalidatePage(key)` — busts `page:<key>` and `revalidatePath` for all 4
  locales (called by the S12 admin publish action).

## Backoffice (`admin/`) — schema-driven page editor (S12)

Plugs into the backoffice shell. Contributes one `content`-group screen (top of the group,
`admin/screens.ts` → `pagesAdminScreens`); the list + per-page editor mount under
`app/(admin)/admin/(panel)/pages/…`.

- `admin/form-model.ts` (pure, unit-tested) — `describe(schema)` walks a page's **fixed Zod
  schema** into a serializable `FieldNode` tree; `emptyValue` / `applyDefaults` scaffold a `data`
  object (fixed-count arrays padded to length); `humanizeKey` makes labels. Leaf mapping:
  `*_media_id` → media picker (a `.describe()` on the media schema becomes the uploader hint:
  recommended size/format), ZodBoolean → checkbox, ZodString → text (textarea when long).
- `admin/queries.ts` (server-only) — `listPagesAdmin` (the five pages + whether each exists),
  `getPageForEdit` (source `data` + og image + media previews), `getPageEditModel` (adds the
  `FieldNode` tree, computed **server-side** so Zod stays out of the client bundle).
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — `savePage`: validates `data` against
  `pageSchemas[key]` (single source of truth for shape), upserts `page_content`, `revalidatePage`.
  **No translation-table writes** — source lives in `data`; target locales are S14's job.
- `admin/ui/` — `list.tsx` (server; no status column — pages are always live), `page-editor.tsx`
  (client island; the social-share image + nested `data` edited immutably by path),
  `schema-fields.tsx` (recursive `FieldNode` renderer, surfaces media `hint`s).

Editing an unauthored page works: `applyDefaults` scaffolds the empty skeleton from the schema.

## Deferred / escalations / handoffs

- **Lead forms (S10)**: ✅ wired — `lead-cta.tsx` embeds the leads widget via its contract.
- **Richer JSON-LD** (`Organization`/`LocalBusiness`/`FAQPage`/`Service`): belongs in
  `core/seo` (**S13**, ADR — golden rule 3), not hand-written here.
- **Translation review** of page [T] blocks: **S14**, on the `core/i18n` seam.

## Tests

`tests/pages.test.ts` — the per-page translatable-path contract + the pure overlay logic
(`expand`, `overlayTranslations` with source fallback, `collectMediaIds`) + schema validation
(fixed-count arity, unknown key). `tests/pages-admin.test.ts` — the schema → form model
(`describe` leaf/array detection, `emptyValue`/`applyDefaults` scaffolding, `humanizeKey`). Run:
`npx tsx --test src/slices/pages/tests/pages.test.ts src/slices/pages/tests/pages-admin.test.ts`.
