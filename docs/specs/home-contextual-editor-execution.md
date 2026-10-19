# Home contextual editor — execution

2026-10-18. Authorized implementation of the closed plan. Base c28615fd80e9d10fb941d9ac11bd5bbbf39d73ce;
initial checkout clean. Integration home-contextual/integration at
/private/tmp/central-hill-home-contextual-integration. Forms checkout/3064 and concept3070 preserved.
No main integration, push, deployment, GitHub or production access.

## Contracts and ownership

ADR0039 and backoffice/page-editor-types.ts define the shared interface before consumers.
Shell receives PageEditorAdapter with sections/bindings, selectedId/onSelect, locale/onLocaleChange,
previewUrl/previewVersion, dirty/busy, status, inspector and actions. Shell exports PageEditorShell;
bridge exports PageEditorPreviewBridge taking {instance:string, bindingIds:string[]}.
Preview bridge query parameter is instance; messages use channel central-hill-page-editor,
instance, ready/select and bindingId. Both sides check origin/source/instance and allowlisted IDs.
Preview annotations are data-editor-binding="<binding ID>". Selection IDs match dotted schema paths;
section IDs may be selected. Viewports1440/768/390 are document widths, visually scaled to fit.

A: home-contextual/shell, /private/tmp/central-hill-home-contextual-shell.
Exact write set: src/slices/backoffice/ui/page-editor-shell.tsx,
src/slices/backoffice/ui/page-editor-preview-bridge.tsx,
src/slices/backoffice/ui/page-editor-bridge.ts,
src/slices/backoffice/tests/page-editor-bridge.test.ts,
src/slices/backoffice/README.md. No other files. Root exports components from contract.

B: home-contextual/home, /private/tmp/central-hill-home-contextual-home.
Exact write set: src/slices/pages/home-content.ts, schemas/home.ts,
admin/home-save.ts, admin/home-media-validation.ts, admin/home-contextual.ts,
admin/home-actions.ts, admin/home-queries.ts, admin/ui/home-contextual-editor.tsx,
ui/home-page.tsx, server/home-translations.ts, tests/home-contextual.test.ts,
README.md (all prefixed src/slices/pages/ except schemas/admin/ui/server/tests shorthand).
B supplies full adapter, saved-content preview renderer annotations, source/target save/read,
revision protection, stable stats identities, validation, existing controls/media queue reuse.
B exports getHomeContextualModel() from admin/home-queries, HomeContextualEditor({model}),
HomePage({locale,preview?:boolean}); private Home preview bridge is root-owned route.
Root integrates admin/actions.ts, admin/queries.ts, server/queries.ts, form-model.ts if needed,
backoffice/contract.ts, Pages contract.ts, routes, four root messages/{en,es,pt,fr}.json files, ADR/spec/docs,
new isolated local QA environment. Root scope additions: pages/admin/ui/schema-fields.tsx
(reuse identity-aware list control for Home stats) and settings/contract.ts (public chrome exports). B may request scope expansion before editing other files.
No migrations expected; root owns any necessary schema registry/migration changes.

## Acceptance and checks

All current Home fields reachable including hidden/empty sections and SEO/OG. Same public renderer,
no section reorder. Saved-content preview left, inspector right, outline, selection/focus and real
viewport widths. Authenticated private/noindex preview; navigation/submits blocked, Avantio external.
EN source Save and publish; ES/PT/FR local drafts across tabs, review/approval/fallback/stale using
kernel pipeline, shared references/structure untouched. Atomic source sync, stale-write conflicts,
stable list IDs, preserve translations. Media queue flush before save; media existence/MIME validation.

Node22/pnpm typecheck; lint; explicit affected tsx --test files; build on isolated Home DB.
db:check if migrations occur. Manual boundary, four-locale/SEO/ISR review. Independent normal
scoped QA: text/media/button save/reload/public; one upload; stats list identity and ES
fallback/review/approval/stale; desktop/mobile batched pass and affected-fix confirmation only.
QA environment must use new synthetic DB/storage/user and distinct ports, recorded below.

## Progress

Contracts1a90e63; A759937d integrated as3e4f586; B76e739c integrated as9d64d30.
Root integrated route, private preview/public chrome contract exports, four-locale messages,
Home dispatch, revision/source-invalid model, public stable-identity translation resolution,
and existing identity-aware list control reuse. Initial integration had no kernel changes
or migrations; later scoped Hero annotation amendment is recorded below.

New isolated Home environment: synthetic DB/user homecontextualqa; Docker containers
central-hill-home-contextual-db (5608), central-hill-home-contextual-proxy (4508), network
central-hill-home-contextual-qa. Existing0000..0022 applied only there. Synthetic staff
homecontextualqa@example.test/test1234. S3rver9065, bucket homecontextualqa, session36345/PID63044.
Preview planned3065. Environment/harness/logs /private/tmp/central-hill-home-contextual-qa;
no production credentials copied. EMAIL_PROVIDER=console. Home fixture sourced from demo
builder with blank media and2synthetic figures. Existing Forms3064/concept3070 preserved.
Dependencies installed with Node22/pnpm frozen lockfile (no lock changes).

Initial integrated typecheck0, lint0 (7baseline warnings), explicit7tests0.
Build on255f3e2 exit0 after sandbox port denial was retried with escalation.
Root scope addition: pages/tests/pages-admin.test.ts, align legacy layout fixture with
visible schema fields (new private list metadata must stay hidden). Initial broadened
147tests:144pass/3fixture failures, addressed by filtering hidden nodes as real caller does.
Independent normal scoped QA running on build255f3e2 at3065. Server session95319.
Design detector run once on4changed UI files exit0, JSON=[] (no findings). Final candidate and evidence below.


## Verification ledger

- Contract base1a90e63; integrated executable255f3e2; test/docs follow-up47d5742.
- Node22.23.3/pnpm10.8.0; pnpm typecheck exit0, pnpm lint exit0 (7existing warnings).
  Final logs typecheck.log/lint.log (47d5742).
- pnpm exec tsx --test src/slices/pages/tests/home-contextual.test.ts
  src/slices/backoffice/tests/page-editor-bridge.test.ts
  src/slices/pages/tests/pages-admin.test.ts src/slices/pages/tests/pages.test.ts
  exit0,147/147tests, tests.log. Tests need local tsx pipe permission; initial sandbox denial
  is recorded, successful run used escalation. No placeholder scripts counted.
- pnpm build exit0 using isolated Home environment; build.log. Initial sandbox attempt
  failed because Turbopack could not bind its local worker port; escalated same command passed.
- No migration; db:check not required by this task. Existing migration SQL used only on new
  QA database. Manual boundary review: new cross-slice imports through contracts only;
  Pages owns Home, Backoffice owns generic shell/bridge, Settings exports shared chrome.
  Initial candidate changed no core files; later optional Hero annotations are recorded below.
  Public routes retain their ISR configuration/metadata and page:home
  tag plus four-locale revalidation on source/target saves.
- Mechanical detector once over4changed UI files exit0, no findings ([]). Actual browser
  inspection/persistence testing belongs to independent QA report; detector is not its substitute.

## Scoped correction during QA

Root static review found that fixed-length benefits/assurances retain move controls;
translation identity must cover guests_pitch.benefits and services_carousel.assurances,
not just stats.figures. Owner B assigned correction in its existing worktree/write set:
Home domain/adapter/tests/README (schema only if needed). Root owns schema-fields condition
expansion to reuse identity-aware lists for all three paths. No capability removed.
Existing stats-only metadata is normalized compatibly; retired identities become list-scoped.
This is required by closed plan's stable translated lists, not a scope expansion to another page.
Independent QA will confirm affected list behavior on corrected candidate.

Root scope addition under amended ADR0039: src/core/ui/hero.tsx and
src/slices/pages/ui/home-page.tsx (single orchestrator writer while B edits only domain/
adapter/tests/README). Add optional Hero.editorBindings attributes for private background,
eyebrow and subtitle selection. Public callers omit the prop; no layout/style changes.
Root hit-test review found background click intercepted by Hero container/scrim, selecting
section instead of media. QA supplied3elementFromPoint samples. Confirm after rebuild.
A fix b4a5e9a integrated899e669 also blocks standalone authenticated preview actions,
without sending self-messages. B fixa950260 integrated6b10cc3 covers all3movable lists.

## Corrected candidate verification

Executable6359b6d. Node22.23.3/pnpm10.8.0:
- pnpm typecheck exit0, typecheck-final.log.
- pnpm lint exit0,7baseline warnings, lint-final.log.
- Same four explicit tsx test files exit0,149/149tests, tests-final.log.
- pnpm build with isolated Home env exit0, build-final.log.
Initial root-owned server95319 stopped before rebuild; corrected production-mode
preview3065 root session81445, server-final.log. Storage session36345 unchanged.
Independent QA completed original grouped pass; affected confirmation now covers
all3list identity reorder behavior, ordinary media selection, standalone preview
blocking and public annotation absence. Final result: independent scoped QA approved6359b6d, no unresolved blocker.
corrections.cjs exit0 confirmed ordinary background media selection, approved ES benefits/
assurances after reorder/save/reload, standalone CTA/submit blocking/noindex, public attrs absent.

Root documentation write set also includes AGENTS.md and
home-contextual-editor-delivery.md to record the current implementation handoff.
User reaffirmed local QA runs automatically; no production/GitHub writes authorized.

User additionally authorized safe sandbox operations confined to this project. This does
not authorize production/GitHub writes or change the local-only delivery boundary.

## Completion

Home pilot complete on executable6359b6d after independent normal scoped QA. All required
checks passed (149tests, typecheck, lint, build), media persistence/public output verified.
Delivery and limitations: home-contextual-editor-delivery.md. QA: home-contextual-editor-qa.md.
Only documentation/whitespace changes follow the tested executable. No source files left
untracked; original Forms checkout remains clean atc28615f. Task checkouts retained.
No main/push/deployment/GitHub/production writes. New preview3065 remains running with
synthetic content and its isolated DB/storage. Previous environment artifacts preserved;
final listener read observed3065/9065, not3063/3064/3070 (no assertion they are running).

Independent QA report-only commit14d85fd. Final closure changes documentation only.
