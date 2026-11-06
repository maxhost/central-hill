# Live preview update report — 2026-11-05

Superseded validation detail: the later [all-Pages audit](pages-live-preview-audit-2026-11-05.md)
makes Buildings fallback media optional at schema level, preserving raw absence
for target shared-field guards. The initial required-media insertion fix and its
historical verification below are retained as context; see the later report for
the final candidate and expanded coverage.

User reports editing text does not change preview, including Refresh. Expected
behavior remains300ms idle + in-memory render without Save draft. Refresh sends
the current local payload; no content write, upload, cache invalidation or publish.

Root investigated serially on existing main/509d785 working tree. All pending
Home localized-link and nine-editor label changes remain preserved, including
untracked files and unrelated base-logo PNG. Initial investigation made no code
changes; the confirmed correction and final checks are recorded below.

## Read-only findings

- Current3071 server logs show preview POSTs for Home/Buildings with HTTP200.
  This does not prove result.ok: validation/server failures also return200.
- Current four Home draft-or-published snapshots pass validateEnvelope and
  validatePageLivePreview; all actual persisted media references/MIME checks pass.
- Buildings has no page_locale_content rows yet. Its legacy source parses,
  normalizes and passes the same EN preview and real media checks. No bootstrap
  performed. No target-locale Buildings persistence claim.
- Diagnostics used SELECT only against the already configured remote DB. They
  print error paths/booleans, no content/credentials. No login/session creation,
  data updates, schema changes, saves, publish or uploads.
- Shared shell sends serialized local state after300ms and on Refresh; live
  wrapper preserves latest response and reports idle/updating/validation/server.
- Independent read-only reviewer identifies action-prop identity churn as a
  possible fragility, not established cause. Installed Next skips page rendering
  for these no-revalidation actions; no unsupported refactor was made.

## Isolated reproduction

`/private/tmp/central-hill-live-preview-fix/next-fixture` uses real shared
PageEditorShell, PageEditorLivePreview and PreviewBridge under Next16.2.9 with a
real inline Server Action returning synthetic content. No DB/auth/persistence
imports or credentials. Temporary3198 server, separate node_modules symlink,
config/messages, no changes to project environment or3071 runtime.

Playwright `check-real-action.mjs` passes local typing, Refresh and a subsequent
typing update: final state idle, no pageerror, edited h1 displayed without Save.
This covers the common bridge/Server Action mechanism, not the user's current
local payload, real Pages renderers, media or authenticated session. Webpack
fixture (not the user's Turbopack runtime). Initial fixture lacked next-intl
config; adding its own request config fixed the fixture setup only.
Artifacts: `diagnose.ts`, `validation-results.jsonl`, `check-real-action.mjs`,
`next-fixture.log`. Tests source/fixtures contain no production credentials.

## Confirmed correction

### Confirmed reproduction after user clarification

User specifies Buildings, EN, Hero Title = “Mi titulo”. Read-only baseline validation
passes with absent legacy hero. Creating only `hero: { headline: "Mi titulo" }`
then fails draft/live validation at `hero.image_media_id`. That field is required
inside the optional Hero object (empty string selects fallback). The current
client setter materializes missing object parents as `{}`, omitting siblings.
This explains why both automatic updates and Refresh retain last valid content.

Root owns the bounded fix: new pure `admin/field-update.ts`, client
PageContextualEditor setter integration, focused `tests/page-field-update.test.ts`,
Pages README, current handoff, `admin/form-model.ts` media optionality metadata,
one corresponding metadata assertion in `tests/pages-admin.test.ts`, and this
spec. Supply blank required-media defaults only
for nested objects on the edited path; preserve existing authored siblings and
unrelated absent sections, flags and list identities. No list scaffolding or
normalization is needed for this bounded correction. Optional media retain absence
to avoid introducing a shared-field delta on otherwise valid target-locale edits.
Do not initialize persisted snapshots or change draft/publication rules. Scope
also covers continued editing of an already sparse local parent, without a forced
reload or loss of the user's current input.

Functional verification: reproduce pre-fix failure, test exact Buildings edit,
recovery of an existing sparse Hero and missing nested contact, preserving
unrelated sections/media and immutable input; focused bridge/live-validation
regressions. Extend the isolated Next fixture with the real contextual editor,
Buildings descriptor and real server validation/BuildingsHero rendering where
possible; no authenticated DB mutation. Typecheck/lint and compile-only build
with synthetic env; full persistence/prerender not claimed. Independent scoped
source review after fix. All existing pending work remains intact.

Initially the exact page/field and locale were missing; user subsequently supplied
Buildings EN Hero Title “Mi titulo”, reproducing the validation failure above.
`validation` points to current full payload/media; `server` to render failure;
stuck `updating` to response/queue lifecycle; advancing idle revision with stale
content to renderer consumption. These were diagnostic branches, not findings.

## Final verification and delivery

- `pnpm typecheck`:exit0, final runtime source.
- `pnpm lint`:exit0, seven existing warnings.
- Node22 `pnpm exec tsx --tsconfig src/core/ui/tests/tsconfig.json --test`
  on `page-field-update.test.ts`, `buildings-editorial-adapter.test.ts`,
  `home-live-preview.test.ts` and Backoffice `page-editor-bridge.test.ts`:
  exit0,14/14. Five new field-update regressions include exact pre-fix rejection,
  absent/sparse Hero recovery, preserved existing asset/contact copy, absent
  Guides enabled semantics and Home target optional-poster/shared-field equality.
- Focused `pages-admin.test.ts` media-metadata assertion:exit0,1/1 after updating
  the expected optional flag. Expanded initial form-model suite was70/79: one
  metadata assertion required this update; eight other failures concern unchanged
  historical layout order, hidden Guest fields, missing layout link or added About
  media slot expectations. They were not repaired/reopened as part of this bug.
- `pnpm build --experimental-build-mode compile`:exit0 on final source with
  synthetic unreachable DB/R2/auth overrides. No full prerender/DB-backed QA claim.
- Browser final: actual PageContextualEditor/NodeField, Buildings descriptor,
  validatePageLivePreview/validateEnvelope and BuildingsHero/Hero under isolated
  Next16.2.9 with real inline Server Action. EN “Mi titulo” displays without Save;
  Refresh preserves it without iframe navigation; continuous “Mi titulo actualizado”
  keeps input focus and appears;390px “Mi titulo móvil” appears. Four preview POSTs,
  final idle state, no pageerrors. See `buildings-browser-result.json`.
- Fixture stubs storage/contact-dialog/queue/persistence seams and limits registry
  to real Buildings schema/media validators; unrelated Home draft-schema re-export
  is unused/stubbed. No auth/DB calls, catalogue, global settings, real media or
  production save/publish exercised. No stylesheet/layout approval claim.
- Fixture setup required explicit aliases and isolation from unused exports;
  earlier fixture compilation/timeouts are preserved in its log. The initial
  append-typing check used macOS End semantics and failed an expected string;
  final check explicitly cleared and typed the full string, recording exact value.
  No additional product change was made for that harness-only correction.
- Independent scoped source reviewer found and confirmed the optional-poster
  regression correction; no remaining source blockers. No independent browser or
  persistence QA approval is claimed. `git diff --check`:exit0.

Final source changes for this bug only: new `admin/field-update.ts`,
PageContextualEditor uses it for ordinary field edits; `admin/form-model.ts`
preserves optional media metadata; new `tests/page-field-update.test.ts`, one
`tests/pages-admin.test.ts` assertion, Pages README, handoff and this report.
All prior pending work, untracked files and logo remain intact. No kernel,
schema/migration, URL policy, preview validation weakening, save/publish or auth
changes. No DB writes, login/account/session creation, upload, push/deploy/commit.

Artifacts in `/private/tmp/central-hill-live-preview-fix/`: final tests/metadata,
typecheck/lint/build logs, fixture/scripts, browser result and read-only diagnosis.
Temporary3198 fixture server closed. User's3071 still listening (PID74407 at final
read-only check); no stop/restart forced and no unsaved user state discarded.
