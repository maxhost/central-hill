# Home contextual editor — local delivery

2026-10-18. Implementation of the closed [plan](home-contextual-editor-plan.md),
[execution](home-contextual-editor-execution.md) and ADR0039. Base c28615f.

## Location and behavior

Branch home-contextual/integration; checkout
/private/tmp/central-hill-home-contextual-integration. Corrected executable6359b6d;
independent scoped QA approved with no unresolved blockers.
QA report commit14d85fd. See [independent QA](home-contextual-editor-qa.md) for reproducible evidence. Initial executable255f3e2/test follow-up47d5742.

Preview http://127.0.0.1:3065/admin/pages/home, synthetic staff
homecontextualqa@example.test / test1234. Source Home plus synthetic figures/media/test
translations; no production content or credentials. Console email only, no real sends.
Server3065 root session81445 (corrected build); storage9065 session36345/PID63044. Full harness/environment,
logs and screenshots: /private/tmp/central-hill-home-contextual-qa.

Home now uses a reusable Backoffice contextual shell: saved-content canvas, selectable
sections/elements, inspector, actual document widths1440/768/390, EN/ES/PT/FR drafts in
local component state, pending indicator and preview refresh after saves. Pages owns its
Home adapter/bindings, validation/media queue, atomic source-sync and guarded target
snapshots. EN Save and publish; targets Save for review / Approve translation, approved
stale targets retain the current public fallback policy. Stable IDs for figures, benefits and assurances preserve
translations when reordered. SEO/OG remains editable with existing metadata and ISR.

Private preview outside admin chrome is staff-only, dynamic/noindex, same shared Home RSC
renderer plus shared Settings header/footer. Private-only bridge validates origin/source/
instance/known bindings and blocks page navigation/submissions. Public renderer does not
mount the bridge or emit annotations. Avantio is displayed as an external integration
notice privately and remains the original integration publicly. No Forms selector/slot,
section reorder, new public form runtime or rollout to another page.

## Changed files and checks

Complete tracked changes: git diff --name-only c28615f..HEAD. New shared editor types,
shell/bridge/tests in Backoffice; Home domain/schema/adapter/actions/queries/save/media/
translations/tests in Pages; editor route + new private preview route; Pages and Settings
contract exports; four locale messages; ADR0039, execution/QA/delivery documentation.
No migrations. The only kernel change is opt-in Hero.editorBindings under ADR0039;
no public call enables it. Contracts and READMEs updated.

Typecheck0, lint0 (7pre-existing warnings), explicit149tests0; corrected integrated build0 (all final logs *-final.log).
Logs and exact commands in execution spec. Initial sandbox restrictions on Git metadata,
local sockets and build worker ports resolved through escalation; no check suppressed.
Design detector run once on4UI files: exit0/no findings. Independent browser evidence
and affected-fix confirmation are recorded in the approved QA report.

## Preservation and boundary

New isolated synthetic DB homecontextualqa, PostgreSQL17/5608, Neon HTTP proxy4508;
new S3rver bucket homecontextualqa/9065. Existing0000..0022 applied only to that DB.
Forms checkout at c28615f and preview3064, concept3070 and earlier environment artifacts
preserved. Worktrees home-contextual/shell and home-contextual/home retained with their
local dependency symlinks (untracked local artifacts, no source files omitted).
Integration uses its own frozen-lockfile dependency install. Delivery remains on the task
branch; no main integration, push, deployment, GitHub or Neon production writes.

## Deliberate limits

Preview uses saved content. Pending text remains in component memory only and is lost
on a full reload; no live preview, snapshots or durable drafts. Other page editors retain
their existing behavior. Public Forms placement/submission and Avantio editing are outside
this Home pilot. No claim of global QA or a full four-locale browser matrix.
Final read observed listeners3065/9065 only;3063/3064/3070 were not observed in that read.
Their checkout/environment artifacts were preserved and their processes were not stopped
by this task; no claim is made that they are currently running.

## Complete path inventory

Tracked changes and new documentation captured in the local delivery:

```text
AGENTS.md
docs/decisions/0039-home-contextual-editor.md
docs/specs/home-contextual-editor-delivery.md
docs/specs/home-contextual-editor-execution.md
docs/specs/home-contextual-editor-qa.md
messages/en.json
messages/es.json
messages/fr.json
messages/pt.json
src/app/(admin)/admin/(panel)/pages/[key]/page.tsx
src/app/(admin)/admin/preview/home/page.tsx
src/core/ui/hero.tsx
src/slices/backoffice/README.md
src/slices/backoffice/contract.ts
src/slices/backoffice/page-editor-types.ts
src/slices/backoffice/tests/page-editor-bridge.test.ts
src/slices/backoffice/ui/page-editor-bridge.ts
src/slices/backoffice/ui/page-editor-preview-bridge.tsx
src/slices/backoffice/ui/page-editor-shell.tsx
src/slices/pages/README.md
src/slices/pages/admin/actions.ts
src/slices/pages/admin/home-actions.ts
src/slices/pages/admin/home-contextual.ts
src/slices/pages/admin/home-media-validation.ts
src/slices/pages/admin/home-queries.ts
src/slices/pages/admin/home-save.ts
src/slices/pages/admin/queries.ts
src/slices/pages/admin/ui/home-contextual-editor.tsx
src/slices/pages/admin/ui/schema-fields.tsx
src/slices/pages/contract.ts
src/slices/pages/home-content.ts
src/slices/pages/schemas/home.ts
src/slices/pages/server/home-translations.ts
src/slices/pages/server/queries.ts
src/slices/pages/tests/home-contextual.test.ts
src/slices/pages/tests/pages-admin.test.ts
src/slices/pages/ui/home-page.tsx
src/slices/settings/contract.ts
```

Integration checkout has no unrelated changes or omitted source artifacts.
