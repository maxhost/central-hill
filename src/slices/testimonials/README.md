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

## Backoffice (`admin/`) — testimonial CRUD (S12)

Plugs into the backoffice shell. Contributes one `content`-group screen
(`admin/screens.ts` → `testimonialsAdminScreens`, order 30); the list + create/edit
form mount under `app/(admin)/admin/(panel)/testimonials/…`.

- `admin/validation.ts` — `testimonialSaveInput` (the editor's post shape: `id?`,
  nullable `property_location`, `min(1)` on the required [T] `quote`).
- `admin/queries.ts` (server-only) — `listTestimonialsAdmin` (every status, source
  `quote`) and `getTestimonialForEdit` (one record's source values). Not cache-wrapped
  (admin is dynamic).
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — `saveTestimonial`
  (scalar columns written directly; the [T] `quote` via the `core/i18n` write seam,
  ADR 0019; `revalidateTestimonials`) and `deleteTestimonial` (row + its translations).
- `admin/ui/` — `list.tsx` (server) and `testimonial-form.tsx` (client island).

## Rendering (deferred to the consumer)

The testimonial section/card UI lives with the consuming **S9 pages**; this slice ships
only the read model + admin.

## Tests

`tests/testimonials.test.ts` — input validation + the translatable-path contract.
`tests/testimonials-admin.test.ts` — the admin `testimonialSaveInput` schema. Run:
`npx tsx --test src/slices/testimonials/tests/testimonials.test.ts src/slices/testimonials/tests/testimonials-admin.test.ts`.
