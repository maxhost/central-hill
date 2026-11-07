# Amenity labels and localized Building selector —2026-11-06

User requests four Label inputs (EN/ES/PT/FR) in Amenity create/edit, then translated
checkbox names in the matching Building editor language with the same selections
across languages. Base main5c66aee, tracked clean except preserved logo/publicmedia
symlink. Integration amenity-locales/integration at
/private/tmp/central-hill-amenity-locales-integration. Local main/3071 delivery;
no push/deploy/remote writes/new DB/schema. Existing synthetic propertylocalesqa
test permission persists. No follow-up Services/Apartment lifecycle work.

## Contract and acceptance

ADR0064 uses existing amenity translation rows. AmenitySaveInput retains EN label
and adds optional translations:{es,pt,fr}, strings trimmed/max80; EN required1–80.
Omitted translations preserve older-client targets; present blank target removes
only that target label, falling back to English. One existing Save applies labels
immediately; nonblank manual targets approved through core i18n seam. No automatic
translation, separate target Publish or new kernel API/migration. Pending authored
targets load raw into form; absent values stay blank (not copied fallback). EN
change must preserve custom target values. Existing sequential action writes are
retained, no new atomicity claim. Slug/icon/group/usage/delete behavior stays.

AmenityOption optionally adds labels:Record<Locale,string> (actual query fills all
four, English/slug fallback). Existing label remains English compatibility. Edit
data adds translations raw record. Shared type amenity-types.ts. Selector uses
labels[locale] with label fallback for older fixtures; checked state still uses
stable shared amenity_ids. Selecting in EN appears selected ES/PT/FR before/after
Save and reload. Text/SEO/publications unaffected; existing common Save semantics.
Public Building amenities use already localized approved reader and taxonomy Save
invalidates relevant Building/Apartment/Home tags and admin Building edit layouts.

## File ownership

Root: this spec, ADR0064/index, amenity-types.ts, initial admin/validation.ts schema,
initial optional query-interface additions, messages4locales, AGENTS.md,
docs/data-model.md if documentation alignment needed, integration/runtime.

Backend: amenity-locales/backend at /private/tmp/central-hill-amenity-locales-backend.
Writable src/slices/buildings/admin/actions.ts (Amenity save only);
admin/queries.ts (Amenity reads only, other queries preserved);
server/amenity-labels.ts new helper to persist validated labels through existing
core seams, invoked by staff-gated action; tests/amenity-locales.integration.test.ts;
README.md. Revalidate Building admin routes as well as public cached reads after
Save. No kernel/schema/UI/messages edits. Request needed scope changes.

UI: amenity-locales/ui at /private/tmp/central-hill-amenity-locales-ui. Writable
src/slices/buildings/admin/ui/amenity-form.tsx; ui/amenity-payload.ts;
ui/building-locale-editor.tsx; tests/amenity-admin.test.ts. Four explicitly labelled
stacked text fields Label EN/ES/PT/FR, ENrequired, target fallback hint, proper ids,
maxlength80 and disabled pending. Keep slug/icon/group and existing page styling.
Form state owns EN label plus target record; payload sends all trimmed targets.
Selector picks option.labels?.[locale]??option.label, no new selection state.
No new tests mirroring markup; extend pure payload/schema cases meaningfully.

Independent QA: docs/specs/amenity-label-locales-qa.md and private artifacts under
/private/tmp/central-hill-amenity-locales-qa/independent only. No nested delegation.
Review integrated candidate, 3bounded normal desktop/mobile browser groups:
four-label Save/reload/manual approved/fallback and EN preserves custom targets;
Building tabs label change/shared selection Save/reload/public locale names;
taxonomy rename updates published amenities without republishing Building text.
No broad/aesthetic screenshot matrix; root manages sole frontend3071.

## Environment and verification

Node22/pnpm, same /private/tmp/central-hill-building-status-qa/env.sh and real
propertylocalesqa DB5658/proxy4558/storage9077. Verify SQL DB+role before any writes.
Store tests own e770 amenity/Building identities; browser root seeds e771 new
Amenity/Building only. No mutations to d/f/e751/e761/user fixtures. Clean own store
fixtures, retain browser demo. Do not change DB schema or use remote Neon.
No production credentials copied. Preserve actual-main3071PID58039/session64126
until candidate build ready; root swaps onto3071 and returns main after approval.

Checks: pnpm typecheck; pnpm lint; pnpm exec tsx --import
/private/tmp/central-hill-property-forms-qa/test-runtime.mjs --test
src/slices/buildings/tests/amenity-admin.test.ts
src/slices/buildings/tests/amenity-locales.integration.test.ts
src/slices/buildings/tests/property-locale-state.test.ts (safeenv+node-runtime.cjs).
Integrated pure checks and actual browser persistence/public ISR; identical writer
DB tests need not duplicate. pnpm build after store fixture cleanup; use local
CIRCLE_NODE_TOTAL=3 for2workers to avoid earlier high-machine-load timeouts, without
tracked config changes. db:check unnecessary without migration. Explicit boundary,
four-locale copy/fallback and cache review. Record commands/exits/hash/limits.

## Progress

Root contracts land before consumers. Results and final runtime follow.

Integrated executablecdab195 (backendabf3d5e, UI2832ca7). Roottypecheck0,
lint0(7existingwarnings),16/16puregroups0, diffcheck0; identical backend3/3DBgroups
passed after fallback/snapshot-fixture correction, e770 fixtures cleaned. New e771
Amenity/Building browserfixtures guardednew-only, no old data overwritten. Mechanical
UI detector once returned[]. Independent source review no blockers; fullbuild and
3normal production-browser groups pending. Local2worker build only, no config edits.
Root also owns docs/data-model.md to record manual approved taxonomy labels and
shared ID semantics, documentation-only change after executable verification.

Fullbuild0/114pages with local2workers. Actual-main58039/58033 stopped; compiled
production candidate3071 PID77622/session19724, login200, same safeenv/synthetic
DB/storage. Independent3group browser review running against e771 only. Public
translated names/no-Building-republish explicitly requested in user follow-up and
included in DB/browser acceptance. No executable changes after cdab195.

Independent functional approval executablecdab195:3/3browser groups0. Four labels
persist/reload; pending stays private until manual Save; blank fallback; EN selection
shared in4tabs before/afterSave/reload and4localized public names without Publish;
rename EN/clear ES updates public without touching Building snapshots/revisions/
text/SEO/shared selection. Mobile controls work,0pageerrors, olddatahashes unchanged.
Initial hash harness assumed id on composite building_amenity; corrected before
browser or writes, then full functional run0. Report amenity-label-locales-qa.md.
Only e771 demo retained; no source changes after executable verification. Root
local main integration and final single-dev3071 read-only opening check follow.

## Actual main runtime completed

Independent report07fca86 approved. Local main ff5c66aee→3cea4e8 after approval;
compiled candidate77622/77616 stopped. Actual main dev3071 PID82624/session64768,
cwd verified /Users/maxi/Documents/claude-workspace/central-hill; same safeenv,
propertylocalesqa/storage9077/public symlink. Root main-open.mjs read-only check
passes own Amenity+Building and user d600200: four labels, final raw values retained,
same IDchecked in4language tabs with localized/fallback names,0pageerrors. Artifact
/private/tmp/central-hill-amenity-locales-qa/main-open.json. Initial root locator for
required EN did not match; corrected harness to QA-proven accessible label, then
passed. No product/source changes or content writes after QA; no repeated matrix.
Original logo/publicmedia symlink remain unstaged, all worktrees retained. No push,
deployment, new schema or remoteDB actions. User may review actual main3071.
