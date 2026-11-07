# Building booking button — execution (2026-11-06)

User requests exactly Label and Link in Building Booking, independently editable
for EN/ES/PT/FR. Base e029605 on main, clean except preserved logo and synthetic
public media symlink. Integration: building-booking/integration at
/private/tmp/central-hill-building-booking-integration. Local main/3071 delivery,
no push, deployment, remote credentials or remote writes.

## Contract and compatibility

ADR0062 adds optional localized booking_button {label,link} to existing v1 JSON.
No migration. It is excluded from BUILDING_SHARED_KEYS, so Save/Publish, source
inheritance, locale ownership, CAS and public invalidation keep existing semantics.
New documents start Book Now/null. Existing documents without this object retain
legacy booking_url/default_booking_url resolution; opening or unrelated Save
does not materialize the object. Editing either field copies the displayed pair.
Explicit null link hides Building-specific buttons, without legacy/global revival.
Label maximum80, link HTTP(S) maximum2048; label required on Publish if link set.

Both Building detail buttons use an authored label/link. Legacy top/bottom labels
and destinations stay unchanged until authored. Global navigation and Apartment
buttons are unaffected. Listing-card external navigation flag remains available
among shared flags, with accurate wording; Booking contains only Label and Link.
Old technical values remain preserved internally, without exposed edit controls.

## Ownership

Root: this spec, ADR0062, editorial-types.ts, booking-button.ts,
admin/ui/property-editor-state.ts, initial optional validation schema, contract.ts,
messages/{en,es,pt,fr}.json, AGENTS.md, final integration and runtime.

Backend writer: building-booking/backend at
/private/tmp/central-hill-building-booking-backend. Writable:
src/slices/buildings/server/queries.ts; server/editorial-validation.ts (after root
contract); tests/building-booking.test.ts; tests/building-booking.integration.test.ts;
tests/property-locale-state.test.ts; README.md. Other files read-only; request
expansion if needed. Query sets booking.label only for explicit booking_button.

UI writer: building-booking/ui at /private/tmp/central-hill-building-booking-ui.
Writable: src/slices/buildings/admin/ui/building-locale-editor.tsx;
src/slices/buildings/ui/building-detail.tsx. Preserve tabs/gallery/form styling.
Use getBuildingBookingButton pure helper, avoid materialization on no-op edit.
No source/shared contract edits. No nested delegation.

Independent QA: integrated candidate, writable docs/specs/building-booking-qa.md
and private /tmp artifacts only. Review actual EN/PT Save/reload/Publish, legacy
destinations, explicit clear, unchanged other locales, desktop/mobile. No new app
ports: root temporarily serves candidate on3071 then returns real main3071.

## Verification and permissions

Existing authorized synthetic propertylocalesqa only: Postgres5658/proxy4558,
storage9077. Verify SQL database+role before writes. New e750 store-test and e751
browser fixtures; existing e410 regression-test fixtures are also scoped-owned.
Clean owned test rows; do not touch d/f/e640/e740/user fixtures. No migration.
Use Node22 and safe /private/tmp/central-hill-building-status-qa/env.sh, existing
server-only/AsyncLocalStorage test loader. No production env copies to writers.

Integrated commands: pnpm typecheck; pnpm lint; pnpm exec tsx --import
/private/tmp/central-hill-property-forms-qa/test-runtime.mjs --test
src/slices/buildings/tests/building-booking.test.ts
src/slices/buildings/tests/building-booking.integration.test.ts
src/slices/buildings/tests/property-locale-state.test.ts
src/slices/buildings/tests/property-form-model.test.ts; pnpm build after fixture
cleanup. DB check unnecessary: no schema change. Review cross-slice boundaries,
4locale messages, existing Building ISR invalidation, preserved SEO/media.

Acceptance: Booking has exactly two stacked fields, localized. Inherited work
follows EN until first real local edit; custom PT survives later EN changes.
Draft remains private; explicit locale Publish alone changes its public buttons.
Both public Building CTAs show correct text and URL; clear hides both. Existing
effective destinations remain intact on read and unrelated Save. Shared flags,
photos, SEO and Apartment scope behavior remain intact.

## Progress

Checkpoint e029605 captures previously completed tabs/gallery refinement.
Root contract landed before consumer worktrees. Verification/results follow.

Integrated executable fdb462f: typecheck0, lint0 (7 existing warnings),
15/15 pure groups0; identical backend32e1b81 passed11/11 DBgroups including3new
with e750/e410 cleaned and e751 preserved. New browser seed e751...001 Building
plus e751...002 Apartment uses existing synthetic city/media; no fixture overwrite.
One Impeccable detector pass on changed UI returned[]; no aesthetic test loop.
Full production build0 (106pages) after test cleanup. Independent browser review
ran on the compiled production candidate at3071, exercising real ISR invalidation.
All5bounded groups pass; report: building-booking-qa.md. No unrelated fixture
changes or browser errors; e751 demo retained. Integration to local main follows
reviewer handoff; root then restores a single actual-main dev3071 and performs
one read-only open check. No new schema/migration, push, deployment or remote DB.

## Local main runtime completed

Independent approval report573c4a4. Local main ff e029605→12ee8e5 after approval;
compiled candidate31388/31382 stopped. Actual main dev3071 PID35045/session3504,
cwd verified /Users/maxi/Documents/claude-workspace/central-hill; same safeenv,
propertylocalesqa and storage9077/public symlink. One read-only main-open.mjs check
passed: editor200, exactly2Booking fields, ENemptylink/PTcustomvalues preserved,
0pageerrors. Artifact /private/tmp/central-hill-building-booking-qa/main-open.json.
No duplicated functional matrix, source changes or new DB writes after QA.
Main preserves original untracked logo and synthetic publicmedia symlink. All
worktrees retained. No push/deployment/remoteDB; user can review editor3071.
