# Slice `translation` / `translation-pipeline` (S14)

Adapted Guides (ADR0066): guide_page, guide_section and guide_place use the guide's
whole-tree manual locale editor. Inbox excludes all three types; old links resolve
their guide through the Guides contract and redirect to its selected language.
All six legacy mutations and direct generation reject Guides before writes. No
translation rows are deleted; global Translations and other entity workflows remain.

Adapted Pages (ADR0040): Home, Owners, Buildings listing, Real Estate, Guest, Services, About, Guides and Blog. Pages owns complete draft/published JSON by locale. These pages
are excluded from this generic review inbox, and direct review routes redirect to their
contextual editors. Save/clear/approve/reset/generate entrypoints reject these registered pages via the
Pages contract identity lookup; other entity workflows remain unchanged. Legacy page
rows are retained for bootstrap and are never deleted by this adaptation.

Adapted Blog Posts (ADR0057): `blog_post` is excluded from this inbox. Direct
review links redirect to `/admin/posts/[id]?locale=...`; all six legacy mutations
and direct generation reject articles before touching their translation data.
The Blog contract owns this identity policy. Articles use manual complete
draft/published snapshots per language in Blog, preserving legacy rows.
ADR0067 also excludes `author` and `blog_category`: their single forms own manual
EN/ES/PT/FR inputs, one Save and English fallback. Old review links redirect to
`/admin/authors/[id]` and `/admin/blog-categories/[id]`; generic actions/generation
reject both types. All legacy translation rows remain. Other unadapted entities
keep this workflow. Historical page-content notes apply only where still active.

Adapted Properties (ADR0058): `building`, `apartment` and `building_faq` are
excluded from the generic inbox. Direct review redirects to the building or
nested apartment editor in the requested locale; FAQ links resolve their owning
building. All six legacy mutations and direct generation reject these types
before writes via the Buildings contract policy. Complete locale snapshots own
the manual workflow; old translation rows remain preserved. Amenities and
geography retain the generic workflow.

About follow-up (ADR0037): page-content target writes compare and lock the source
value in the same SQL statement. If source has changed/disappeared, the write is
rejected; generation counts only successful writes. Per-cell editing retains its
draft and shows an error on failed saves. Page-content mutations also invalidate
`page:about`, so approved About copy updates without rebuilding the site.

The LLM-assisted, human-reviewed **translation workflow** (ADR 0007 / ADR 0021).
Owns **no tables** and **no migration** — it operates on the cross-cutting kernel
`translation` table **generically by `entity_type`**, exclusively through the
`core/i18n` read/write/provider seam (golden rule 4). Backoffice-only; never on the
public ISR path.

## Workflow

`source authored (en, draft)` → **`generateDrafts`** (LLM provider → `needs_review`
per target locale, stamping `source_hash`) → **backoffice review** (approve / edit /
reset / clear) → **`approved`** → publish revalidates the entity's public cache.
Editing the source later makes a target **stale** (its `source_hash` no longer
matches the live source) — surfaced in the inbox and re-draftable.

The public render policy is unchanged (`core/i18n/loadContent`): a target renders
only when `approved`, otherwise it falls back to the source (`en`). So this slice's
job is purely getting target rows to `approved`.

## What it produces

- **Review inbox** (`/admin/translations`) — one row per entity with a per-state
  rollup (missing · stale · needs-review · approved), view + entity-type filters.
- **Per-entity review** (`/admin/translations/[type]/[id]`) — the source-vs-target
  matrix with target-locale tabs and per-cell actions (approve, edit, reset, clear)
  plus entity-level actions (generate, generate-all, approve-all).
- **`generateDrafts(type, id, opts?)`** — the draft-generation pipeline (provider
  seam → kernel target writes). Fills missing/stale cells by default; `overwrite`
  re-drafts everything.

## Boundaries

All translation-table access is the kernel seam (ADR 0021 additions):
- read: `loadTranslationRows(filter?)`
- write: `setTargetTranslation`, `setTranslationState`, `deleteTranslation`
- provider: `getTranslateProvider()`, `hashSource()`

The inbox matrix (source vs targets, staleness, rollup) is derived **in memory**
(`admin/derive.ts`, pure + unit-tested) from the raw rows — the dataset is the CMS's
[T] content, small, read dynamically in the gated admin. The slice never imports
another content slice's internals; it treats `entity_type` as opaque (entity-type
labels fall back to the raw string when unkeyed).

## Provider

`core/i18n/translate.ts` defines `TranslateProvider`; the default is a **pass-through
identity** stub (seeds each draft from source for a human to refine) until a concrete
LLM client is wired behind the same interface (`TRANSLATE_API_KEY`; ADR 0021
follow-up). Public pages never reach the provider.

## Revalidation

Approving/resetting/editing a target is a `requireStaff`-gated Server Action that
`revalidatePath`s the admin screens and best-effort busts the entity's public ISR
tags (`cacheTags.entity(type,id)` + `cacheTags.list(type)`, covering both tag
conventions slices use). Other tag shapes ride the daily ISR fallback.

## Contract (`contract.ts`)

`translationAdminScreens` (sidebar registration, `translation` group);
`generateDrafts` + `GenerateOptions`/`GenerateSummary`.

## Routes (brand-new, gated `(panel)`)

`app/(admin)/admin/(panel)/translations/{page.tsx, [type]/[id]/page.tsx}` — thin
handlers importing the inbox/review screens.

## i18n

A root `translation` message namespace + `backoffice.nav.translations` label,
authored for **en/pt/es/fr** (messages consolidated in root `messages/<locale>.json`).

## Deferred / follow-ups

- A concrete LLM provider behind `getTranslateProvider()` (the interface is ready).
- Auto-`generateDrafts` from each content slice's `publish()` on source save (the
  contract exports `generateDrafts` for this; currently triggered manually from the
  review screen).
- Per-cell translator attribution/history (only `updated_by`/`updated_at` are kept).

## Tests

`tests/translation.test.ts` — pure derivation tests (cell status incl. stale vs
approved, the entity matrix + rollup, inbox attention-first ordering, title
derivation) + the kernel `hashSource` and identity provider. Run:
`npx tsx --test src/slices/translation/tests/translation.test.ts`.
