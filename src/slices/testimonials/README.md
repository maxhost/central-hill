# Slice `testimonials` (S7)

Audience-tagged customer testimonials, **shared by the Home / Owners / Guests pages**.
This slice has **no public routes of its own** — it is a read model that S9 pages embed
through the contract. See `docs/vertical-slices.md` → S7, `docs/data-model.md` → Slice
testimonials.

## Owns

**Table** (`schema.ts`, migration `0000`):
- `testimonial` — `audience ('owner'|'guest'), rating (1–5), author_name, author_country,
  property_location?, position, status`. [T]: `quote`.

`author_name` / `author_country` / `property_location` are **not** translated (proper
nouns / places); only `quote` lives in the `translation` table.

## Contract (`contract.ts`)

Type: `Testimonial`, `TestimonialAudience` (`owner | guest`).
Read: `listTestimonials(locale, audience?)` — published testimonials in `position` order,
optionally filtered by audience; `[]` when none. Cache tag: `TESTIMONIAL_TAGS.list` =
`testimonial-list`.

The read is `unstable_cache`-wrapped (keyed by locale + audience) and tagged so a publish
busts it. **S9 pages that embed testimonials should add `TESTIMONIAL_TAGS.list` to their
own cached reads' tags** so a testimonials publish cascades the page refresh.

## i18n

DB content only — the `quote` [T] field resolves through `core/i18n` with the source-locale
(`en`) fallback + `approved`-only gating. No UI-chrome strings (the rendering page owns its
section copy).

## Revalidation (`server/publish.ts`)

`revalidateTestimonials()` — the single place that busts the `testimonial-list` tag. Called
by the testimonials admin actions (S12). Since testimonials render only inside S9 pages
(which subscribe to the same tag), this one bust cascades everywhere they appear.

## Deferred (not in this slice's first cut)

- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12** — testimonial form,
  audience/rating/order, translation review. Not buildable before S12.
- **Rendering**: the testimonial section/card UI lives with the consuming **S9 pages**;
  this slice ships only the read model.

## Tests

`tests/testimonials.test.ts` — input validation + the translatable-path contract. Run:
`npx tsx --test src/slices/testimonials/tests/testimonials.test.ts`.
