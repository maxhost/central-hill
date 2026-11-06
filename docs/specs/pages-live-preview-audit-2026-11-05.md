# All Pages live-preview audit — 2026-11-05

User requests checking all nine Pages editors for failures equivalent/similar to
Buildings first Hero edit and correcting them so valid local edits render without
Save. Intentional invalid/unsafe payloads must retain last valid output with clear
feedback, not bypass auth/schema/media/identity guards or become public.

Base509d785, main checkout `/Users/maxi/Documents/claude-workspace/central-hill`.
All previous pending Home button/URL, nine-editor copy and Buildings preview fixes
are pre-existing and must remain. Unrelated base-logo PNG untracked, ignored env
and running3071 preserved. No commit, push, deployment, schema/data writes, login,
new session, upload, save/publish or production action authorized in this audit.

Root is the only code writer. Two independent read-only audits cover optional
schema/target guards and server/bridge/renderer consumption; no agent worktree or
write assignment is implied. Findings precede fixes. New shared contracts, if any,
are root-owned before consumers. No kernel change currently planned.

## Audit and acceptance

- Every page: common editor -> local payload -> draft/live validation -> same
  renderer with injected locale content. Inspect nested/sparse optional groups,
  first field edits, optional media absence, list identities and target shared guard.
- Systematic DB-free matrix removes optional objects from otherwise valid legacy
  fixtures, edits authored leaves through production setter, and reports unintended
  validation failures. Distinguish incomplete explicit input from missing siblings.
- EN/PT/ES/FR local edits/Refresh and latest-wins behavior; page/shared_aside surface
  selection and stale result/error feedback. Scoped browser coverage with actual
  shared editor/validator and renderer where feasible, synthetic backends only.
- No auto-save/upload/public invalidation from preview. Target changes must not
  introduce shared-field deltas, unedited optional flags or default content changes.
- Keep changes bounded to supported defects. Record scenarios, commands/results,
  candidate source paths, independent source review and browser/persistence limits.

## Initial write set / verification

Root: this report, current visual handoff and Pages README; existing Pages
`admin/field-update.ts`, `admin/form-model.ts`, `admin/ui/page-contextual-editor.tsx`,
`admin/live-preview-validation.ts`, `admin/live-preview-actions.tsx`,
`admin/editorial-preview-route.tsx`, `editorial-content.ts`, adapter/type modules
and focused Pages tests only when findings support changes. Backoffice shared
preview types/bridge/shell/live wrapper and four message files only for confirmed
generic preview defects/feedback. Extend exact paths here before editing beyond
this set. No database migrations/kernel/persistence model changes planned.

Node22/pnpm: explicit affected DB-free tests, typecheck/lint, compile-mode build
with synthetic unreachable DB env (full prerender/persistence unavailable without
authorized isolated DB). One grouped browser pass plus targeted confirmation for
actual corrections. Do not reopen unrelated historical broad-test failures.

Temporary audit scripts/artifacts: `/private/tmp/central-hill-pages-preview-audit/`.

## Confirmed findings / root-owned changes

1. Owners optional helper CTA label creates a missing hidden URL; renderer uses
   fixed #worth. Make only that ignored URL optional in source/draft schemas.
2. Buildings absent stats needs optional figures (renderer already uses ??[]).
3. Buildings Hero/calculator and Owners closing CTA fallback media must be
   optional within their optional blocks. This matches public fallback semantics,
   avoids invented shared blanks on target edits and leaves shared guards strict.
4. Root-level localized Owners stats_title is not set/stripped because homeSet's
   parent lookup mishandles a one-segment path. Fix the pure top-level setter.
5. Fresh Home factory creates seven invalid blank icons; seed check as existing
   Owners/Guest factories do. No existing snapshot normalization/write.
6. CountUp retains previous display for reduced motion/no IntersectionObserver/
   newly unparseable values. Root owns core motion/count-up.tsx and its focused
   browser fixture; record kernel change in ADR0056/index before editing.
7. Verify Home/Guest nested source replacement: remount only video when its actual
   source changes if browser confirms stale currentSrc. Root owns their two page
   renderers for this bounded correction.

Exact additions to write set: schemas/owners.ts, schemas/buildings.ts,
adapters/owners.ts, home-content.ts, core/ui/motion/count-up.tsx, HomePage/GuestPage,
new ADR0056/index, existing page-field-update regression expectations plus new
`tests/pages-live-preview-audit.test.ts`. No kernel validation/DB/auth changes.
Two existing Buildings fixture tests (`buildings-editorial-adapter.test.ts` and
one `pages-admin.test.ts` expression) now acknowledge optional figures in their
TypeScript access; no behavior assertions removed.

8. Target optional-group copy can disappear when preparing from EN with that group
   absent (72 synthetic cases exposed this). Scope missing-object materialization
   to prepareTargetEnvelope via optional homeSet flag; do not fabricate arrays/rows,
   overwrite null/scalar ancestors, or materialize undefined clearing. Legacy and
   pending-overlay calls retain their default missing-parent behavior.

## Delivery and evidence

Final candidate is the uncommitted working tree on509d785; all earlier pending
work remains. Two independent read-only source audits identified the defects;
final source reviewer reports no remaining scoped blockers. This is source review,
not an independent authenticated browser/persistence approval.

### Schema/editor matrix

`matrix.ts` exercises608 page/field/group combinations across all nine adapters.
Final report:0unintended validation errors,0shared-field deltas,0lost target texts.
The persisted regression suite repeats those combinations for EN/ES/PT/FR:
2432edits covering draft/live/identity validation, strict shared equality and
target copy after preparing from EN. It also covers top-level translated fields,
ignored helper URL publication, invalid input rejection, and no fabricated arrays
or replacement of null/scalar ancestors.

Fixtures remove optional groups from valid synthetic content. Only private
identity metadata is then regenerated; raw absent content stays absent, including
Services/Guides/Blog whose production normalizers otherwise scaffold those groups.
An initial normalized-fixture coverage gap was corrected and the twelve audit
tests rerun:exit0. No real snapshots were changed or normalized into storage.

### Browser coverage and boundaries

Actual PageContextualEditor/NodeField, shared shell, live wrapper/bridge and actual
live validators run with synthetic model/HTTP render seams and disabled
save/publish/upload/navigation. Nine page Hero-title cases each pass EN/ES/PT/FR
edits, local-value retention on return to EN and Refresh with stable iframe URL.
Owners absent closing CTA adds another four locale cases. Home additionally
passes invalid-input last-good/recovery, latest-wins delayed response and390px
editing. Render responses use a marker heading from the validated payload; full
page renderers/catalogues/auth/real media are not mounted in this broad fixture.
Separate source audit confirms all nine renderers and Blog/Guides shared_aside
consume injected content; the preceding Buildings audit exercised its actual Hero.

The grouped pass completed those40editor/locale cases, then stopped at a fixture
selector for the Owners helper target textarea (targets have no NodeField ID).
The script was corrected to select its last text control; a targeted continuation
passes all four helper locales and Refresh. Thus44distinct editor/locale cases
are covered, without repeating the completed nine-page pass. The aborted initial
pass did not reach its final aggregate pageerror assertion; do not claim a clean
full error log for it. The targeted continuation reports no pageerrors.

Actual CountUp passes prop updates in reduced-motion, missing-IntersectionObserver
and normal-motion modes, including a new nonnumeric string. Canvas/MediaRecorder
generates two tiny blob videos in the browser: the unkeyed source-change control
keeps the old currentSrc despite the new source attribute; keyed replacement
loads the new resource and replaces only the video node. Home/Guest now apply
that URL key. This proves browser resource selection semantics; it is not a full
Home/Guest media-upload or live-renderer test. No actual media upload occurred.

### Commands and results

All use Node22/pnpm, working directory is this checkout.

- `pnpm typecheck`:exit0 on final runtime source.
- `pnpm lint`:exit0,7existing warnings. A new test's prefer-const issue was fixed
  after strengthening raw-group coverage; final lint rerun passed.
- Final focused command with explicit files:
  `pnpm exec tsx --tsconfig src/core/ui/tests/tsconfig.json --test`
  `pages-live-preview-audit.test.ts`, `page-field-update.test.ts`,
  `home-button-links.test.ts`, `page-locale-drafts.test.ts`,
  `editorial-engine.test.ts`, `buildings-editorial-adapter.test.ts`,
  `owners-editorial-adapter.test.ts` (all under Pages/tests):exit0,28/28.
- Expanded affected-adapter/bridge command on17explicit files:57/60. Three
  inherited failures expect Guides city_filter.note or Services how_it_works to
  remain editable, but those controls were already intentionally hidden at HEAD.
  Evidence: `editorial-rollout.test.ts:22`,
  `guides-editorial-adapter.test.ts:84`, `services-editorial-adapter.test.ts:100`.
  Their schemas were not changed in this audit; no removed controls restored or
  assertions weakened. This command is not reported as passing.
- `pnpm build --experimental-build-mode compile`:exit0, final runtime source with
  synthetic unreachable DATABASE_URL and synthetic media/auth overrides. This
  compiles all routes without a full prerender or production DB queries.
- `git diff --check`:exit0. Cross-slice imports unchanged; CountUp kernel change
  owned by root and documented in ADR0056. No migration or db:check needed.

Artifacts `/private/tmp/central-hill-pages-preview-audit/`: matrix.ts/results/final
log; browser-audit.ts/build-browser.mjs/bundle and browser.log (grouped harness
selector failure); browser-targeted.log/browser-results.json (four helper locales,
three counter modes and legacy/keyed video); regressions-final.log,
raw-group-regressions.log, focused-final.log (57/60), typecheck-final.log,
lint-final.log and build-compile-final.log.

## Limits / state left for user

Explicit invalid/unsafe/incomplete inputs retain the last valid preview with the
existing localized notice. Empty stats still intentionally hide the stats band;
closed dialogs/wizard steps can contain updated text that is not currently
visible. No new editor interaction surface for those hidden states is claimed.

No database/credentials/auth-session operations in this audit, no save/publish,
upload, public invalidation, automatic storage initialization, commit/push/deploy.
Full production prerender and real authenticated DB-backed browser sequences were
not performed. Temporary3199 fixture server closed; localhost3071 remains running
(PID74407 at final read-only check). Unrelated base-logo PNG preserved.
