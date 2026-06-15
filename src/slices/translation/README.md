# Slice `translation` / `translation-pipeline` (S14)

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
