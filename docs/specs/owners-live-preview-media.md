# Owners live preview: unresolved legacy Hero media — 2026-11-05

User reports Hero and Figures edits never update on3071. Base509d785/main;
all preceding pending work, unused logo and existing runtime preserved.
Root-only implementation: `admin/live-preview-validation.ts`,
`admin/live-preview-actions.tsx`, `tests/page-live-preview-media.test.ts`, this
report and the visual handoff. No schema, kernel, storage or persistence change.

Read-only diagnostic of existing Owners EN source confirms a valid envelope and
live payload after a Hero edit, but actual resolved media fails only at
`hero.image_media_id`. There are no locale draft rows; source is legacy content.
The renderer already handles the missing asset with an external fallback. The
saved preview uses it successfully, while the live action previously rejected
the entire page for the same unresolved reference. No data/credentials printed.

Private preview now excludes missing valid UUID assets from resolved media errors,
so the existing renderer fallback remains usable. Available assets still undergo
the adapter's MIME checks; malformed IDs and local blob type/origin/reference
guards remain enforced. Save/Publish continue to require uploaded assets. Same
rule applies through the common nine-page preview action. No automatic saving,
uploads, public invalidation, DB writes, commit, push or deployment.

## Verification and limits

- Node22 `pnpm exec tsx --tsconfig src/slices/pages/tests/tsconfig.json --test
  src/slices/pages/tests/page-live-preview-media.test.ts
  src/slices/pages/tests/owners-editorial-adapter.test.ts`:6/6 pass, exit0.
  Initial new test needed a synthetic stats row (default factory has zero); fixed
  the fixture before the passing run. Invalid IDs, local blob MIME/origin,
  available asset MIME and strict Save/Publish media errors remain covered.
- `pnpm typecheck`: exit0. `pnpm lint`: exit0, seven existing warnings.
- `pnpm build --experimental-build-mode compile`: exit0 with synthetic unreachable
  DATABASE_URL and synthetic auth/media settings. No full prerender/DB exercise.
- Isolated Next16.2.9 webpack fixture on3197 uses actual PageContextualEditor,
  shell/bridge/live preview, `renderPageLivePreview`, Owners adapter and full
  OwnersPage renderer. Synthetic locale models contain a missing Hero UUID;
  auth, media resolution and shared data dependencies are stubbed; save/publish/
  upload disabled. Playwright passes Hero, Figures title/label and Refresh in
  EN/ES/PT/FR, EN shared count987%, FR mobile Hero;13preview POSTs only, idle
  states, stable iframe for Refresh, zero browser errors. Fixture bootstrap
  initially imported a server adapter into the client; switched fixture defaults
  to pure form-model/normalizer imports, with no product code change needed.
- Independent read-only source review by home_links_review found no blocker;
  this is not an independent authenticated runtime QA claim.

Artifacts: read-only diagnostic in `/private/tmp/central-hill-live-preview-fix/`
(`diagnose-owners.ts`); new fixture/build/browser evidence in
`/private/tmp/central-hill-owners-preview-fixture/` (`browser-result.json`,
`browser.log`, `build.log`, fixture source). No real staff browser/session or
persistence cycle was used. Historical Hero reference still needs clearing or a
valid uploaded replacement before Save/Publish; no DB repair is authorized here.
Local3071 and the user's unsaved state were left alone; only the owned temporary
fixture is stopped after verification. No commit/push/deploy.
