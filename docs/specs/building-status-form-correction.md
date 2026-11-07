# Building status and form correction —2026-11-06

User reports archived items cannot edit/publish, published items have no clear
archive path, and inconsistent field widths/two-column Content EN. Implement the
correction, not a plan-only response. Base52cf4bd (includes approved previous back
button fix), main clean tracked files; original logo and local public media symlink
untracked. Main3071 devPID90520/session55366, safe propertylocalesqa DB5658/proxy4558,
storage9077 and public symlink. No new schema/migration; existing synthetic QA data
permission persists. Only new owned e64/e74 fixtures, no edits d/f or user's earlier
QA69a344cf/46559ec8. Preserve env, logo, DB, all worktrees. No push/deploy/remotes.

## Product correction / contracts

- Archive is reversible global visibility, not a content lock. Existing localized
  publications are retained; all public locales/children hidden while archived.
- Save draft may edit archived Buildings; content/common Saves keep archive state.
  Common values remain shared, but public hidden until restore/publication.
- Publish archived Building validates saved selected-language draft, publishes only
  that language, and atomically activates global identity (status published).
  Other localized drafts/publications are not changed; already published languages
  become visible again through global restoration. Explicit missing-language Pub
  remains required. Existing shared/source CAS, semantic guard, hiddencommon guard
  and references validation remain. No automatic publication from Save/Restore.
- archiveBuilding(id) bootstraps legacy snapshots BEFORE hiding identity; preserves
  publications on first archive of an untouched legacy Building. Action staff-gated.
- restoreBuilding(id) activates identity: published if any previous publication,
  otherwise draft. Keeps every draft/revision and never publishes new text/SEO.
- Agreed action signatures exported from Buildings admin/editorial-actions.ts:
  archiveBuilding(id:string):Promise<BuildingStatusResult>;
  restoreBuilding(id:string):Promise<BuildingStatusResult>. New type in editorial-types.
  Store helpers archiveBuildingIdentity(id,actor),restoreBuildingIdentity(id,actor)
  return same status result. Graph lock/fresh statement; update only own identity.
- Actions invalidate Building/Apartment/list/Home/metadata and admin workspace layout.
  Restore/bootstrap read behavior preserves GET/no-write rule.
- UI Archive/Restore accessible at sticky Save/Publish controls (not footer-only).
  Archive confirmation stays. Stay in editor after archive/restore, preserve unsaved
  local work across all tabs. Header badge/view link refresh without remount/reset;
  router.refresh allowed only if actual preservation confirmed. Publish updates
  archived local state too. Delete remains separate/destructive; no lifecycle redesign.
- All fields in one vertical column. One consistent max width, text/select controls
  matching minheight44px, textareas matching minheight128px and full width. Photos,
  gallery, geography and SEO use same column, no half-width orphan wrappers.
  No duplicate inner title for existing workspace; New retains its header/back.
  Keep current tokens/primitives; no kernel/other screens/global form changes.
- Apart­ment lifecycle is outside this correction; no unrelated refactor/migrations.

## Execution ownership

Integration /private/tmp/central-hill-building-status-integration,
branchbuilding-status/integration. Contract commit before writers. Root owns this
spec/AGENTS/ADR0061 note, Buildingeditorial-types.ts, messages4locales, docs closure,
main integration/runtime, docs/data-model.md and docs/specs/property-forms-main-integration.md.
Dependencies real copy for build; writer links for checks.

A backend: /private/tmp/central-hill-building-status-backend,
branchbuilding-status/backend. Own Buildingsserver/editorial-store.ts,
admin/editorial-actions.ts, tests/property-locale-store.integration.test.ts,
new tests/building-status.integration.test.ts, README.md. Can add server/status.ts
if needed. No UI/types/contracts/messages/schema/Apartment changes. Get actual SQL
errors safely (message/code only, no creds); don't leave debug detail logs.

B UI: /private/tmp/central-hill-building-status-ui, branchbuilding-status/ui.
Own Buildingsadmin/ui/building-locale-editor.tsx,workspace-header.tsx,
workspace-tabs.tsx only (latter two only if status sync requires). Existing back
fix is in base. Read impeccable craft-floor before UI edits; context already loaded
session, no rerun. Send root exact new message keys English before implementation.
No backend/schema/types/messages/global shared controls/Apartment changes.

No nested agents. Writers commit only assigned paths, scopes/checks/limits reported.
Root integrates backend then UI, handles messages. UI can start independent layout
while backend adds action exports; typecheck dependency explicit until both land.

Independent QA after integration owns only docs/specs/building-status-form-qa.md;
artifacts /private/tmp/central-hill-building-status-qa. Root manages servers so only
one project app3071 remains; no parallel previews. Normal bounded functional status
checks, no aesthetic automated audits/screenshot loops (user validates visual L0).

## Verification / completion

Backend meaningful tests: published archive, save archived text/common stayshidden,
restore retains oldpub/private draft/revisions, Publish archived activates chosen
locale without changing others, archived neverpub Restore remainsprivate; legacy
first archive/bootstrap preserves output. New own e64* fixture identities only.
Typecheck/lint/focused actual tests/build integrated. db:check only if schema changes
(none planned). Fullbuild AFTER DBtestcleanup (avoid transient fixture generation).
Aesthetic-only layout no new visual tests/automatic QA; user reviews3071. Browser
functional checks confined status Save/reload/archive/restore/Publish/private draft,
unsaved other-locale preservation through header refresh, desktop/mobile button
reachability. Existing snapshots/caches/counts and four-locale publication intact.
No fresh broad matrix. User requests fixes in current main localhost: deliver via
local main ff after required functional QA, preserve single3071 safe env and all data.

## Progress / evidence

Contracts4ccd877; backend7c2708e→49d7eae, UI6ecdc14→5077515 integrated. Writer
backend12/12DB(type/lint/diff0) and UI scopedlint0(type initially pending missing
backend export) handed off. Integrated5077515 typecheck0, lint0(7existingwarnings),
27/27focused tests0, pnpm build0(101pages after fixture cleanup). No schema changes.
Focused command, with safeenv + AsyncLocalStorage/server-only/staticPNG loaders:

pnpm exec tsx --import /private/tmp/central-hill-property-forms-qa/test-runtime.mjs --test
src/slices/buildings/tests/building-status.integration.test.ts
src/slices/buildings/tests/property-locale-store.integration.test.ts
src/slices/buildings/tests/property-locale-state.test.ts
src/slices/buildings/tests/property-form-model.test.ts
src/slices/apartments/tests/property-locale-store.integration.test.ts

Main90520/90514 stopped by root to keep one app; candidateDev3071 session13609,
source5077515. Browser fixturee740...001 created only for functionalQA; no oldfixture
writes. Independent QA source review found noadditional blockers,5normal browser
functional groups prepared/running, no aesthetic automatic checks/screenshots.
Artifacts/logs:/private/tmp/central-hill-building-status-qa. Final user visual review
remains onmain3071 after local ff. No remoteDB/GitHub/push/deploy.

## Functional QA approved / local delivery

Independent QA approved5077515 in5bounded functional groups: Archive legacy4pubs
and unsaved PT; archivedSave/reload/stillhidden; Restore keeps drafts/revisions and
local EN/PT; PublishPTarchived activates with other snapshots/locals preserved;
mobile Archive/Restore. No product blocker/0pageerrors. Two initial harness waits
were ambiguous after successful mutations, corrected by continuation over the same
state without replay/reset; final confirmation exit0. See building-status-form-qa.md.
No screenshots/geometry/aesthetic automatic QA; visual refinement stays user-reviewed.
Root now fast-forwards localmain and restarts its single3071dev, same safe synthetic
env, no migration or remote/write/deploy. Final PID/hash recorded after startup.

## Actual main runtime completed

Mainff52cf4bd→2d99dba after independent functional approval. Candidate2550/2544
stopped; actualmain3071devPID5677/session63080, cwd verified principal checkout.
Only this app listener remains; safeenv/storage/public symlink unchanged. Root
single read-only main-open.mjs confirmseditorHTTP200, Saveenabled, Archive/Restore
present and0pageerrors; main-open.json. No duplicated broad suite or aestheticQA.
Code remains the tested5077515; closure changes documentation only. Original logo
and syntheticpublic symlink remain unstaged, no other tracked dirt. User reviews
visual layout on3071; no automatic Services/Apartment-lifecycle work initiated.
