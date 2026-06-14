# Slice `faq` (S8)

Grouped **marketing-page FAQs**, shared by the Owners / Guests / Real-Estate pages. This
slice has **no public routes of its own** — it is a read model that S9 pages embed by group
key. Distinct from `building_faq` (per-building, owned by `buildings`). See
`docs/vertical-slices.md` → S8, `docs/data-model.md` → Slice faq.

## Owns

**Tables** (`schema.ts`, migration `0000`):
- `faq_group` — `key (owners|real_estate|guest|…), position`. Binds a set to a page. No [T].
- `faq_item` — `group_id→faq_group, position, status`. [T]: `question, answer`.

## Contract (`contract.ts`)

Types: `FaqGroup`, `FaqItem`.
Read: `getFaqGroup(locale, key)` — published items in `position` order; `null` when the
group doesn't exist, `{ items: [] }` when it has none published. Cache tag: `FAQ_TAGS.list`
= `faq-list`.

The read is `unstable_cache`-wrapped (keyed by locale + key) and tagged so a publish busts
it. **S9 pages that embed an FAQ section should add `FAQ_TAGS.list` to their own cached
reads' tags** so an FAQ publish cascades the page refresh.

## i18n

DB content only — the `question`/`answer` [T] fields resolve through `core/i18n` with the
source-locale (`en`) fallback + `approved`-only gating. No UI-chrome strings (the rendering
page owns its section heading).

## Revalidation (`server/publish.ts`)

`revalidateFaq()` — the single place that busts the `faq-list` tag. Called by the FAQ admin
actions (S12). Since FAQ groups render only inside S9 pages (which subscribe to the same
tag), this one bust cascades everywhere they appear.

## Deferred (not in this slice's first cut)

- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12** — group manager, item
  form, ordering, translation review. Not buildable before S12.
- **Rendering**: the FAQ section/accordion UI lives with the consuming **S9 pages** (same
  pattern as `building_faq`'s inline `<dl>` in `buildings`); this slice ships only the read
  model, shaped (`{question, answer}`) so a future `FAQPage` JSON-LD builder can consume it.
- **`FAQPage` JSON-LD**: belongs in `core/seo` (**S13**, ADR — golden rule 3), not
  hand-written here. `getFaqGroup` already returns the plain Q/A pairs it will need.

## Tests

`tests/faq.test.ts` — group / item input validation + the translatable-path contract. Run:
`npx tsx --test src/slices/faq/tests/faq.test.ts`.
