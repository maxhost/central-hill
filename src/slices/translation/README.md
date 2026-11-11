# Slice `translation` (S14) — retired authoring workflow

ADR0077 retires the global translation inbox, review and generation workflow.
Content is edited manually in its owning Page, Blog, Property, Service, Guide,
auxiliary form or Settings editor. FAQ keeps independent groups selected by each
Page language; there is no new internal FAQ translation editor.

The slice owns no tables and introduces no migration. `core/i18n`, `translation`,
`slug`, editorial snapshots, historical values and public fallbacks remain active
and unchanged. Removing S14 does not delete stored content, approve old targets,
run a backfill or republish any document. Image ALT follows ADR0076 and belongs
to the consuming document and language; previous asset ALT remains a fallback.

## Compatibility only

- `/admin/translations` authenticates staff and redirects to `/admin/pages`,
  including old filter URLs.
- `/admin/translations/[type]/[id]` authenticates staff and resolves the owning
  editor through `getLegacyTranslationRedirect`. Parent identities come from
  their slices' contracts. Unknown types and malformed IDs never open a generic
  editor; a shared asset has no arbitrary chosen owner.
- `approveField`, `resetField`, `saveField`, `clearField`, `approveEntity` and
  `generateEntityDrafts` keep their old call shapes. Each requires staff and
  unconditionally returns `{ ok: false, error: "validation" }`, without reading,
  writing or revalidating editorial content.
- `generateDrafts` and its `GenerateOptions`/`GenerateSummary` types remain for old
  imports. The function always rejects with an explicit retirement error before
  loading content or selecting a provider. It does not create a new session just
  to reject a removed operation.

The public contract exposes the compatibility resolver and rejected generation
entrypoint. There is no replacement automatic translator and no supported
inbox/review/query API. The removed in-memory matrix, rollups and per-cell UI
are not part of the locale kernel. The separate staff-role cleanup remains out
of scope.

## Verification

`retirement-actions.test.ts` calls the real retired action/generator modules with
spies only at their dependencies. It covers known and unknown entity types,
Forms, malformed payloads, authentication denial and zero editorial/provider
side effects. The Testimonial guard tests also remain.

Run the pure action tests with Node22:

```sh
node --import ./node_modules/tsx/dist/loader.mjs \
  --import ./src/slices/translation/tests/retirement-actions-runtime.mjs \
  --test src/slices/translation/tests/retirement-actions.test.ts \
  src/slices/translation/tests/testimonial-quote-guards.test.ts
```

`fixed-navigation-guards.test.ts` and `settings-website-guards.test.ts` retain
real SQL comparisons of their own source/target rows before and after denied
operations. FAQ pending targets and unrelated Navigation rows stay exact.
Fixtures use fresh UUIDs and clean only their own rows. These suites require the
exact `translationsretirementunitqa.local` hostname, database and role; they must
not run against the browser E2E database or environments from earlier tasks.
The DB runtime only doubles authentication and the `server-only` marker; content
reads/writes and the PostgreSQL connection are real. Use the orchestrator's
verified unit-test environment and restricted local preload:

```sh
node --env-file="$QA_UNIT_ENV" --require "$QA_RUNTIME" \
  --import ./node_modules/tsx/dist/loader.mjs \
  --import ./src/slices/translation/tests/retirement-actions-db-runtime.mjs \
  --test --test-concurrency=1 \
  src/slices/translation/tests/fixed-navigation-guards.test.ts \
  src/slices/translation/tests/settings-website-guards.test.ts
```

The old `translation.test.ts` tested only the removed inbox derivation. It and
assertions about hiding rows through deleted inbox queries are removed with
those modules. Assertions that denied mutations preserve actual stored rows
remain; an obsolete successful FAQ-generation case now verifies rejection and
unchanged pending content. Resolver tests cover link compatibility separately.
The task's independent QA verifies the integrated UI, redirects and public E2E;
unit tests do not replace Save/reload/Publish checks in the owning editors.
