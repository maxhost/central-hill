# Home buttons: label and URL per language — 2026-11-05

User authorizes code changes for three Home CTAs: hero primary,
guests_pitch.cta, and the closing guest panel “Planning a stay? Find your perfect
apartment.” Each selected button shows label and URL together, both independently
editable in EN/PT/ES/FR and participating in existing locale draft/publish/preview.

Base `509d785`, checkout `/Users/maxi/Documents/claude-workspace/central-hill`,
branch main. Existing uncommitted button-label refinement (three admin files,
four message files, README, handoff/spec) must be preserved. Untracked base-logo
PNG is unrelated. Root handles this bounded Home feature serially; no parallel
writers. Local source delivery only, no commit/main integration/push/deploy.

## Contract and implementation

- Home-specific HTTP(S) URL schema carries locale metadata. Existing hero and
  guests-pitch URL paths remain unchanged; new optional `dual_cta.guest.cta_url`
  defaults to existing localized Avantio destination when absent/blank. No SQL
  migration, backfill or existing content write. Owner/secondary links unchanged.
- Declaring these paths locale-specific excludes them from shared-field equality
  and preserves the target's own URL when adopting a saved EN template.
- Home inspector expands either label or URL selection into the button's two
  fields. EN and target locales get URL inputs. Other Pages retain their behavior.
- The three actual preview button anchors get private optional annotations;
  kernel forwarding seam recorded in ADR0055. Public callers omit annotations.
- Existing snapshots without the new optional URL remain valid; no auto-save,
  publication, upload or revalidation from typing or selection.

Owned paths (root): Home schema/adapter/content; Home contextual helper and
PageContextualEditor and editorial-content; HomePage, GuestsSection, DualCta; core
button, two-column-showcase and dual-cta-panels annotations; relevant Pages tests
and `core/ui/tests/button-editor-binding.test.ts`; EN/PT/ES/FR URL labels if
needed; Pages README, data model, ADR0055/index, this spec and visual handoff.

## Acceptance and verification

Selected buttons show both fields. Editing/switching languages keeps independent
labels/URLs, including blank optional closing URL and old snapshots. Server schema
recognizes URLs as localized leaves; invalid destinations cannot publish.
Preview/public composition uses selected-locale destinations and private bindings.

Functional change (not L0): run Node22 `pnpm typecheck`, `pnpm lint`, focused
`pnpm exec tsx --tsconfig src/core/ui/tests/tsconfig.json --test` with explicit
affected test paths, and `pnpm build --experimental-build-mode compile`.
Full prerender build awaits an isolated DB environment. DB-free synthetic fixture/browser coverage may run;
no test uses ignored `.env.local` as an isolated environment. Runtime3071 currently
uses remote Neon; no actual save/publish/login/upload, DB fixtures, schema/data
changes, production writes or external services without separate authorization.
Record validation limits rather than claim real persistence QA.

## Results

Local uncommitted candidate on `509d785`, all earlier label edits retained.

- `pnpm typecheck`: exit0 on final functional source.
- `pnpm lint`: exit0 after correcting two new test-only children-prop lint errors;
  seven existing warnings remain. No product code changed for the lint correction.
- `pnpm exec tsx --tsconfig src/core/ui/tests/tsconfig.json --test
  src/slices/pages/tests/home-button-links.test.ts
  src/slices/pages/tests/page-locale-drafts.test.ts
  src/slices/pages/tests/home-live-preview.test.ts
  src/slices/pages/tests/home-contextual.test.ts
  src/slices/pages/tests/editorial-engine.test.ts
  src/core/ui/tests/button-editor-binding.test.ts`: exit0,17/17.
  The two component tests were rerun after their lint-only correction: exit0,2/2.
  Initial scripts/tsconfig run passed15 domain cases but needed the existing UI
  test tsconfig for JSX rendering; no runtime imports were changed to work around it.
- Initial expanded six-file domain suite including `pages.test.ts`:88/90. Two
  failures are unrelated unchanged Owners S6/Guest S2 eyebrow-hint assertions
  (`pages.test.ts:786`/`:1194`), following earlier hidden-eyebrow work. The changed
  Home URL assertions passed. No unrelated schemas/tests repaired here.
- `pnpm build --experimental-build-mode compile`: exit0; synthetic unreachable
  DATABASE_URL and synthetic R2 base/auth secret override local configuration.
  Compile mode is not a full prerendered build. No production DB/static generation
  or persistence test claim.
- Browser:25 functional checks passed, no page errors, on the actual
  PageContextualEditor/PageEditorShell/forms using synthetic EN/ES/PT/FR snapshots.
  Each button exposed two fields; edits survived locale switches independently.
  URL selection at390px also exposed both fields. The fixture stubs server actions,
  router/media operations and iframe renderer; it is not real preview/save/reload
  or visual-layout approval. No DB or external network access.
- Independent scoped read-only reviewer found and confirmed fixes for legacy false
  dirty state and label-only button hit area; no remaining scoped source blockers.
  This is source review, not independent functional/persistence QA approval.
- Impeccable mechanical detector:exit0,[] on edited controls/core buttons.
  `git diff --check`:exit0. No changed cross-slice imports; kernel seam owned by root
  and covered by ADR0055. Four locales and existing locale publication/ISR preserved.

Evidence and reproducible isolated fixture scripts:
`/private/tmp/central-hill-home-button-qa/` (`build-fixture.mjs`, `browser-check.mjs`,
`focused-tests-final.log`, `button-tests-final.log`, `lint-final.log`,
`build-compile.log`, `design-detector.json`). Temporary browser server3197 closed.
Local3071 still listening (PID74407 on final read-only listener check); no restart
needed for this follow-up. No actual DB writes/saves/publications/uploads, no new
environment artifact changes, no commit/push/deploy. Unrelated logo preserved.
