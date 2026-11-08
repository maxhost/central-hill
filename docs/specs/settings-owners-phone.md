# Settings Owners phone → Footer — execution

2026-11-07. User requests the supplied +351910438062 in footer and its Settings
input. Base main064554c trackedclean; original untracked PNGlogo/media symlink
preserved. Existing actual-main dev3071PID78758/parent78752/session68010 remains
until verifiedcandidate. Synthetic propertylocalesqa DB5658/proxy4558/storage9077.
No push/deploy/remote writes, preserve all worktrees/files/fixtures/envs/caches.

## Inventory/contract

Globals currently has Phone/WhatsApp/Checkin and Website, no Owners phone. Footer
receives contactprops, currently Bookings then Checkin/email/WhatsApp. User wants
new independent optional phone, shared four languages; not translating phone value,
no replacing Bookings/Checkin/WhatsApp or changing About/Owners CTAs. Add input in
Contact card after Phone, footer row after Bookings, same icon/presentation, labels
EN Owners /ES Propietarios /PT Proprietários /FR Propriétaires. Empty hides row.

New nullable column owners_phone text DEFAULT '+351 910 438 062' (migration0029).
This initializes only new field; existing columns/rows not overwritten/deleted.
DEFAULT_GLOBALS includes same number for absent singleton. Persistednull/blank is
explicit hidden, no fallback revival. Public getGlobals returns ownersPhone
string|null and key shapev3 so old cache cannot omit it. Admin EditData optional
owners_phone:string, raw null→blank, absent singleton scaffold defaults. Old clients
omit key: Save must omit column from SET; insertomitted getsDBdefault. Full newUI
posts trimmed string ornull. Required public/admin validation ifnonblank min3/max40
like phones, optional to retain oldpayload compatibility. No manual translation rows
for phone; UI/footer labels4messages only. Existing sequential Save/revalidateGlobals
retained. No newkernel API; ADR0071 authorizes additive FooterContact optional props.

## Ownership and order

Root stabilizes contracts/spec/ADR/migration before consumers. Owns schema.ts,
contract.ts/defaults.ts, validation.ts/admin/validation.ts, EditData optional field,
core/ui/footer.tsx, messages4, migrationSQL/journal, README/data-model/AGENTS/docs,
new root tests owners-phone.test.ts and temporarySSRcheck artifacts. Integration
/private/tmp/central-hill-settings-owners-phone-integration branch
settings-owners-phone/integration.

Backend writer /private/tmp/central-hill-settings-owners-phone-backend branch
settings-owners-phone/backend owns ONLY settings/admin/actions.ts, admin/queries.ts
(implementation retain preparedinterface), server/queries.ts (mapping+shapev3),
new tests/owners-phone.integration.test.ts. No schema/core/UI/messages. Oldclient
omission preserves configured/null, normalization/clear/default reads; actual
saveGlobals only new synthetic singleton IF table empty, beforeguard+ownID cleanup.
Refuse if existing singleton; never snapshot/delete/restore old singleton. Wait for
root schemaREADY before DBtests, no schema changes by writer.

UI writer /private/tmp/central-hill-settings-owners-phone-ui branch
settings-owners-phone/ui owns ONLY settings/admin/ui/globals-form.tsx and
settings/ui/site-footer.tsx. Input label admin.globals.fields.ownersPhone and hint
ownersPhoneHint, payload orNull; undefined EditData supportsoldprops via ?? ''.
Use id owners-phone/htmlFor, type tel/autocomplete tel/maxlength40/disabledbusy/errors.
Composer g.ownersPhone trimmed→undefined, t('footer.ownersPhone') label, preserve
otherphones/WA. No aestheticredesign/screenshots/loops. Impeccable context launcher
already ran conversation; read craft-floor before UI edit. Root owns corefooter.

Root integrates two writers sequentially, checks type/lint/db:check/focused schema+
DB+SSR tests and full2workerbuild. IndependentQA afterassembly owns ONLY
settings-owners-phone-qa.md and own artifacts, real normal bounded Save/reload/
publicfourlocales/change/clear/mobile/auth; no visual loops/wide unrelatedmatrix.
Singleton testwrites permitted only if absent and new own record; never touch old
Pages/contactdata. Current read-only preflight shows company_settings0. Before each
new global test assert0; cleanup only returned newID/itsnewtranslationrows. Guard
host+SQLdb/rolepropertylocalesqa. Root owns runtime main→productionQA→actualmain.

## Authorization/environment

AGENTS.md working agreement requires explicit authorization for DB changes. 0029
prepared/reviewable; do NOT apply until user authorizes onlypropertylocalesqa5658.
No schemawrites in preparation. Existing syntheticnew-content QA authorization
remains; otherfixtures allprotected. Node22 safeenv
/private/tmp/central-hill-building-status-qa/env.sh; Neonblock/proxy4558. No secrets.
Settings default Avantio account empty is an existing separate validation constraint;
DB tests use valid temporary own synthetic settings and cleanup, never fabricate or
persist productionbookingconfig. Browser writes onlyownnewfixture with valid test
account, cleanup ownrecord at end; no existingconfig overwrite. If user creates
singleton meanwhile stop dependentwrites/report, don't delete or replace it.

## Progress

Contracts3578c0a +FooterContacttype e79c9e4 stabilized before two writers. User
explicitly authorized0029 onlypropertylocalesqa5658; root verified hostname and
SQLdb/role, appliedoneALTER, default/nullable inspected,42oldbusinesshashes exact
(company_settings comparison excludes only newlyaddedattribute). Evidence under
/private/tmp/central-hill-owners-phone-qa/migration.json; no oldcontactdata writes.
UI6bce8e9 ready, writerTS/scopedlint/diff0. Backend21pure+6DB0, cleanup onlyownnew
singleton/translation rows (guarded initial0), TS/lint0; root SSR8Footercases0.
Actual current Settings remains absent after tests; no userconfiguration changed.

Integrated7da7aed: typecheck0/lint0(7oldwarnings),31cases0 (25pure+6DB), temporary
ownsingleton cleaned, CoreFooterSSR8cases0. Initial db:check caught missing0029
snapshot; root added snapshot0029 derived from0028 with ONLY owners_phone column
and newUUID/prevId chain (assertedparsed equality excludingnewmetadata/column).
SQL0029 unchanged/no reapply. db:check0 after bookkeeping correction (old0008
breakpointwarning retained), all30files/snapshots chained. Build next2workers.
