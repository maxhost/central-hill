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
`about`, `guest`) composed from `_shared.ts` (`iconCard`, `assurance`, `step`, `titledItem`,
`faqGroupKey`, `serviceCategorySlug`, fixed/range array helpers). `schemas/index.ts` maps `key → schema` (`pageSchemas`) and derives
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
page out from `content` + `media`. The shared page hero (full-bleed media band + editorial
headline) is `core/ui`'s `Hero` (ADR 0033 moved it there from this slice, `hero.tsx` → renamed
from `PageHero`) — both `HomePage` (video background) and `OwnersPage` (image background +
`aside` earnings-form card, `compact` headline) render it directly; and `OwnersPage`'s "why"
section is `core/ui`'s `EditorialSplit` (sticky headline + CTAs beside a hairline icon/title/
description list — new, built for this section; see its own docstring for why its entrance
animation is wired internally rather than at the call site, unlike every other animated piece
here). Neither is a `ui/components/` piece. Other shared pieces in `ui/components/`:
- presentational (`blocks.tsx`: `SectionHeading`, `FeatureGrid`, `Steps`, `CtaRow`, `Prose`,
  `Band`; `owner-estimate-form.tsx`: the Owners-hero earnings-estimate card, slotted into
  `Hero`'s `aside` — markup only, see below);
- data-composing (`stats-band.tsx` → settings, `testimonials-row.tsx` → testimonials,
  `featured-portfolio.tsx` → buildings, `services-carousel.tsx` → services, `faq-section.tsx`
  → faq, `lead-cta.tsx` → settings contact).

`services-carousel.tsx` (+ its `services-carousel-track.tsx` client island) is the Home
**services & partners** band (ADR 0032): the page's `services_carousel` block supplies the
heading and the three reassurance marks, while the cards are the published rows of slice
`services` (`listServices`, optionally narrowed by `service_category_slug`), ordered by their
admin `position` and capped at 12. It renders `null` when that block is absent (a `home` row
saved before the section existed) or when no published service matches.

`featured-portfolio.tsx` and `testimonials-row.tsx` take **optional** heading/CTA overrides
(`eyebrow`, `title`, `intro`, `ctaLabel`, `ctaNote`, `ctaHref`). **Home no longer renders either
of them** (ADR 0031); Owners passes none and keeps the shared `pages.portfolio.*` /
`pages.reviews.*` copy; the Guests page passes its
admin-authored `guest.portfolio` block and `pages.reviews.titleGuests`. Both render `null` when
the underlying slice has nothing published, so the section disappears rather than showing empty.

The **Owners** page (`owners-page.tsx`) is **DB-driven** (mock embedded 1:1, but every section now
reads its values from the owners `page_content` row). The **hero + earnings-form card are real
JSX**, not interpolated markup: `core/ui`'s `<Hero id="worth" compact aside={…}>` renders the
background image (`<MediaImage>`, falling back to the approved mock photo until an R2 asset is
set) + headline (`;`-joined phrases → one `<br/>`-separated line each, matching the locked
design's stacked title) + the `ContactDialog` CTA directly (no more DOM-portal — the earlier
`HeroContactCta` indirection is gone), with `owner-estimate-form.tsx`'s `OwnerEstimateForm`
slotted into `aside`. `Hero`'s `compact`/`aside`/`copyClassName`/`actionsClassName` grid
proportions, gap, and headline sizing were ported 1:1 from this page's own CSS (not
`mock/owners.html`'s, which is stale) — see `core/ui/hero.tsx`'s docstring for the exact
cascade/specificity reasoning. The 3-step wizard's client wiring (`est-form-wizard.tsx`,
`est-form-stepper.tsx`) now queries `document` directly instead of a `.mk` ancestor, since the
form no longer lives in the raw-markup wrapper. Everything **below** the hero is still built by
`ownersBodyTop(content, media)`, which interpolates the resolved content into the locked design
markup verbatim — the bespoke per-benefit SVGs, the "★" badge glyph and CTA "→" stay design,
in-page CTAs keep their `#worth`/`#start` anchors, and the form *fields* stay fixed in code
(`lead.kind='earnings_estimate'`). Optional images (`services`/`dashboard`) fall back to the
approved mock photo until an R2 asset is set. Admin text is HTML-escaped before interpolation. It
no longer renders its own section bar: the header's "Owners" mega-menu (settings slice) doubles
as the section sub-nav — it opens on hover and the settings header pins it open once scrolled
past the top (`OWNERS_NAV_CSS`, scoped via `body:has([data-page="owners"])`); on mobile those
anchors live under "Owners" in the burger drawer.
Layout: hero +
earnings form, an animated "numbers" band — still this page's own `stats[×4]
{to,prefix?,suffix?,group,label}` (drizzle 0009), but now rendered as real JSX through the same
reusable, count-up band Home uses (`core/ui`'s presentational `StatBand` + `CountUp`, wrapped in
`<Reveal>`; `#numbers` anchor on its own wrapper div since it sits outside `.mk`) instead of the
raw-HTML grid + `owner-stats-counter.tsx`'s `[data-count]`-scanning counter. Home's own stats
band (`stats-band.tsx` → `StatsBand`) reads different, company-wide figures from
`company_settings` — the two happen to differ, so Owners deliberately keeps its own numbers,
just the shared widget. `owner-stats-counter.tsx` is otherwise unaffected and still shared with
**About**, which still uses the raw-markup `.mk` stats grid. Then the full marketing flow — `why`
("Why property owners trust us") is likewise now real JSX: `core/ui`'s new `EditorialSplit`
(sticky headline + CTAs beside a hairline `benefits[×6]` list — the layout ADR 0022 called
"Editorial Split" when Home briefly had its own version, since removed). It used to be
reproduced as scoped `.mk` CSS (same "`mock.css` styles bare elements, would leak into Tailwind"
reasoning `services`/`dashboard` below still have) because the page itself was a raw-markup
embed at the time; now that the hero/numbers band are real JSX too, there was no longer a
reason to keep `why` as a CSS-scoped duplicate, so it was ported into the reusable component
instead and wired in beside `#numbers`/`#testimonials`/`#faq`, outside `.mk`. Icons stay the old
positional mapping (`WHY_ICON_KEYS` in `owners-page.tsx`, resolved through the shared
`pages/ui/components/icon.tsx` registry) rather than each benefit's own `icon_key` — preserving
exactly what rendered before; wiring `icon_key` through is a separate, not-yet-requested change.
`services` is now real JSX too: `core/ui`'s existing `TwoColumnShowcase` (the same "Image
Showcase" component Home's guests pitch uses — not a new component) via `imagePosition="right"`,
`tone="alt"`, and the new `badge` prop (Owners' floating-badge text differs from the under-CTA
caption, unlike Home's guests pitch where one `cta.note` served both — see that component's
docstring). Benefit icons follow the same positional-mapping precedent as `why`
(`SERVICES_ICON_KEYS`, four new keys added to the `icon.tsx` registry: `camera`/`calendar`/
`wrench`/`trending-up`). `dashboard` (#technology) is the **next, separate step** — same layout
mirrored (`imagePosition="left"`), still the raw-HTML `.owner-showcase.reverse` embed for now, so
`OWNERS_STYLE`'s `.owner-showcase` CSS block stays until it's ported too — `plans` (up to 4 pricing
tiers, with extra air before the single full-width highlighted helper band — drizzle 0010 trimmed
`plans.helpers` 2→1), `journey` — and the closing CTA. Two sections are
shared React islands rendered **outside** the `.mk` wrapper (so `mock.css` bare-element rules don't
leak into their Tailwind markup): the `testimonials` infinite marquee (`<TestimonialsRow>`, the same
component as the home "Partners & Guests" carousel) and the `faq` accordion (`<FaqSection>`). Both
read the DB (testimonials + faq slices, ISR-cached) — the interpolated body is split around them. Per owner
direction the per-section **eyebrow** labels were dropped (titles stay), the hero badge moved into the
form, and `why`/`services`/`dashboard` were restyled; the editable marketing sections (now incl.
`services.image_media_id` + `dashboard.image_media_id`, plans capped at 4 tiers, and the new
`faq_group_key`) are mirrored in the owners schema and stored row, editor-ready (drizzle 0004→0008).

**FAQ is page-selectable (all five pages).** Every page schema carries an optional `faq_group_key`
(blank = no FAQ). The page editor renders it as a dropdown of the FAQ groups authored in `/admin/faq`
(via `faq.listFaqGroups`), and the page renders the chosen group through the shared `<FaqSection>`
(accordion + `FAQPage` JSON-LD). The Owners and Real-Estate pages, whose FAQs used to be hard-coded
markup, now read their group (`owners` / `real_estate`, seeded in drizzle 0008 from the former static
Q&A); Home/Guest/About start blank.

The **Guests** page (`guest-page.tsx`) is **DB-driven** (mock embedded 1:1, drizzle 0012 +
`docs/specs/guest-page-db-wiring.md`): `bodyTop` / `bodyMid` / `bodyBottom` interpolate the
resolved `guest` row into the locked markup, escaped through `esc`/`escAttr`. Its nine sections
split as follows — hero, welcome, why, services teaser and activities teaser come from
`page_content`; the featured portfolio comes from **buildings**, the reviews from
**testimonials** (`audience='guest'`, managed in `/admin/testimonials` — the page schema owns no
testimonials block), the optional FAQ from **faq**, and the dual-CTA contact line from
**company_settings**. `icon_key` renders directly as an Iconoir glyph (`iconoir-<key>`; the font
is loaded globally by `mock.css`), with `iconoir-sparks` as the fallback for unknown keys.
`localizeUrl` rewrites the stored absolute `/en/…` CTA links to the active locale, because
`cta.url` is `z.url()` and relative paths cannot be stored.

**Deploy order matters for this page:** migration 0012 must run before the code ships, otherwise
prerendering `/[locale]/guests` throws on the missing `portfolio` / `dual_cta` blocks. A stale
`.next/cache` from a pre-migration build causes the same failure locally — clear it and rebuild.

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
eyebrows), `reviews.titleGuests` (the Guests-only reviews heading), the dual-CTA copy, and
plural helpers (`portfolio.apartments`, `portfolio.guests`).
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
  recommended size/format), `faq_group_key` → **select** dropdown (a `SELECT_SOURCES` key →
  catalogue heuristic, mirroring the media one; `.describe()` becomes the picker hint), ZodBoolean
  → checkbox, ZodString → text (textarea when long). The `select` options are *not* in the schema:
  `getPageEditModel` fills them server-side from another slice's contract (today
  `faq.listFaqGroups`) and threads them to the renderer alongside media `previews`.
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
