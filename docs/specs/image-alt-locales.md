# Image ALT in owning forms — executable plan

2026-11-08. Base main02c6f21, clean tracked state. Preserve original untracked logo
and public/propertylocalesqa symlink. Request: describe each uploaded image from its
own form, separately in EN/ES/PT/FR, while keeping image identity/bytes shared.
Use Impeccable with incumbent form primitives, no redesign or aesthetic QA loop.

## Contract / acceptance

ADR0076 defines optional content-owned ALT maps and unchanged legacy fallback.
EN starts inherited like other localized content; an own localized ALT edit uses
the existing custom-locale behavior and cannot be overwritten by later EN changes.
Save draft / Publish affect the selected language only. Reorder retains ALT by UUID;
replacing a photo does not attach the prior photo's text. Nested Service itinerary,
Guide section/place and all active cover/gallery/OG pickers included. Existing
Page sibling ALT and Blog body ALT controls reused rather than duplicated. New
uploads can be described before first Save; media queue/upload semantics unchanged.
No stored legacy ALT/slug/SEO/content is rewritten on GET or unrelated edits.

Pages' common visual inspector supplies missing ALT controls in each tab, including
shared image previews in target languages without granting image/layout edits.
Author/City/Settings without tabs receive four ALT inputs near the existing picker,
same Save, existing translation storage, blank target follows EN. Actual readers
must use the corresponding locale without republishing unrelated content.

## Inventory / ownership

Root: core/media/alt.ts, Backoffice media-field + media-alt-field + contract, messages,
Pages slice, Geography City ALT, Settings default OG ALT, docs/specs/decisions,
masterplan, integration/runtime and protective tests.
Writer A: Blog (cover/OG + author avatar), Buildings and Apartments active editorial
types/validation/UI/public/list/preview readers and focused tests, contract-only
foreign imports. No Backoffice/core/messages edits. Root owns shared files.
Writer B: Services and Guides active localized content types/validation/UI/public/
list/private-preview readers and focused tests. Nested image pickers covered by
provider; no Backoffice/core/messages edits. Explicit named cross-slice assignments.
Separate worktrees, no nested delegation. Independent QA after source integration.

## Environment / verification

Integration /private/tmp/central-hill-image-alt-integration, branch image-alt/integration.
Main dev3071 PID13559/parent13553 stays until successful candidate build. DB only
propertylocalesqa5658/proxy4558/storage9077 via existing synthetic env/preload; verify
host and SQL DB+role before own fixtures. Snapshot protected business tables before
mutation and compare after own fixture cleanup. Never mutate existing fixed Pages.
Existing fixture authorization reused; no schema/migration/remote DB/push/deploy.

Run explicit meaningful ALT inheritance/publication/fallback/identity tests, relevant
consumer regressions, pnpm typecheck/lint and build with two workers. pnpm test and
boundary:check are placeholders. Bounded independent browser groups: form/nested
upload controls, cross-language draft+publish and public ALT, legacy/duplicate asset
isolation and non-tab forms. Include mobile, unauthorized mutation and no pageerrors.
Preserve all worktrees/envs/caches/files. Deliver local main after approval; sole3071
actual-main runtime and final read-only opening. Global Translations retirement is
a later technical closeout; do not delete its tables or historical values here.

## Integrated verification before independent QA

Executable004c089 integrates rootf60a53b, B0a9ac75, A004c089 (isolated handoffs
d56b5e1/d51f73c). Root shared contracts75f8c97/48326a5. Integrated57pure cases0,
typecheck0, lint0 with7 unchanged warnings. WriterA40pure+2Blog DB+Building/Apartment
4locale readers0; WriterB41pure+2DB groups0. Root8pure+2DB cases0. Root DBtest
first harness selected no OG override in its legacy fixture; corrected fixture to
select OG explicitly, no product change, then passes. All own fixtures cleaned;
42 protected business-table hashes exactly equal baseline, Settings0. Build and
independent QA pending. Browser may create only new own fixtures after guards.
