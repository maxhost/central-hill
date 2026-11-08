# Settings Owners phone — independent QA

2026-11-07. Candidate `26e5e07` on `settings-owners-phone/integration`,
`/private/tmp/central-hill-settings-owners-phone-integration`; runtime source
`7da7aed` plus root Footer implementation and initial-scaffold correction. Baseline main `064554c`.

Status: **Approved** for source `26e5e07`. Three bounded functional groups passed
in one production-browser run, exit0, with zero page errors. The only created
Settings fixture and its translations were cleaned; all42 protected hashes match.

## Scope and source review

Read AGENTS.md, CLAUDE.md, canonical workflow, execution spec and ADR0071.
Verified cwd/branch/HEAD/status; only prior logo/media symlink untracked. QA owns
this report and `/private/tmp/central-hill-owners-phone-qa/independent/` only.
No product, schema, listener, cache or main changes by QA.

Reviewed schema/default/public/admin contracts, optional target input handling,
conditional SET for old clients, raw edit values, public trim/null mapping and
cache shape v3, form payload/new field accessibility and Footer composition.
The additive kernel contact props are covered by ADR0071. The row follows
Bookings and reuses its icon/layout; only the new Owners row is optional.
Persisted null does not revive defaults. Existing phone/WhatsApp/check-in/About/
Owners CTA behavior stays independent. Settings Save already invalidates globals
and every locale layout, so no marketing-page republish is needed.

## Safe environment and preflight

Migration0029 was explicitly authorized by the user only for synthetic local
propertylocalesqa. Root applied it; QA did not apply schema. Reviewed migration.json:
nullable text column, supplied default +351 910 438 062, old data unchanged.
Host and SQL DB/role are asserted before any SQL. Preflight exit0 confirmed both
propertylocalesqa, singleton0, and exact equality of all42 business hashes with
root's before-migration baseline. Only the new Owners attribute is excluded from
company_settings normalization. Auth tables are excluded from business hashes.

The current authenticated fixture account is Admin per the user's prior grant;
QA creates no Editor/Translator accounts. Any browser writes require an absent
singleton and create one task-owned record through the real Settings form. Its
ID is captured and only it/its own translations may be cleaned. A previously
existing singleton must never be deleted, restored or overwritten for tests.
No uploads or Page writes. The original empty Avantio scaffold would block the
first real contact Save. Before browser execution, root identified the already-used
widget account `bk_centralhill` and prefilled that same account only for an absent
singleton. QA asserted it and saved the untouched valid defaults without a fake
account override. Existing configured rows/validation/widget URLs stay intact.

## Bounded acceptance

The single `independent/check.mjs` run (using `common.mjs`) passed:

| Group | Exercised behavior | Result |
|---|---|---|
| 1 | Absent-singleton form has supplied Owners phone, optional tel input with matching label/ID, autocomplete and max40; Footer shows supplied number and correct Owners label in EN/ES/PT/FR; Bookings/check-in/email/WhatsApp remain correct | Pass |
| 2 | First real Settings Save succeeds using the actual untouched `bk_centralhill` scaffold; new ID captured; reload persists supplied number; change to synthetic +351999123456 refreshes all four public footers without page Publish; neutral settings remain identical | Pass |
| 3 | Mobile Save/reload of blank persists raw SQL null, hides only Owners row in all four languages without default revival; anonymous Settings access redirects to login; supplied number restored in own fixture and verified before cleanup | Pass |

Each group also checked all42 protected business hashes excluding only the new
owned ID during its lifetime. Other scalar/config values were compared exactly
apart from owners_phone/updated_at. Existing new-field owner receipt:
`e95b36ec-e09e-478d-8e4e-ba9984ebfd40`, captured after guarded empty-table creation,
with start/creation timestamps in `owned.json`. Cleanup checked this receipt and
account, then deleted only its translations and its exact Settings ID. Settings
row count returned to0. `protected-before.json` and `protected-after.json` are
identical to root's before-migration baseline for all42 tables.

Evidence: `preflight.log`, `check.mjs`, `common.mjs`, `check.log`/`check.exit`,
`result.json` (three groups, locale phone/link records, zero pageErrors, cleanup),
`owned.json` and protected snapshots. No source fix or harness retry was needed.
No screenshots, geometry checks, aesthetic loop or unrelated broad matrix.
Public supplied-number restoration was verified before direct own-fixture cleanup;
after cleanup this QA claims database equality only, not a cache-refresh test.
The orchestrator owns the final actual-main opening against the empty singleton.

## Integrated evidence

Root owns integrated checks. Reviewed markers: typecheck0, lint0 (7 prior warnings),
32 tests0 (26 pure and6 DB), CoreFooter8 actual-component SSR cases0, db:check0.
The first metadata check found a missing0029 snapshot; root added only new column
and UUID chain metadata without changing/reapplying SQL. An IPC-restricted retry
was rerun with local escalation; current real metadata command passed with only
old0008 breakpoint warning. The first full build passed and was archived. Root prerequisite fix passed its
full32-case rerun, typecheck/lint and metadata checks, then the corrected build
passed with144 routes/two workers. Browser ran only after root READY on the unique
production3071 candidate PID96139/session5633. No browser mutation or false approval
preceded the prerequisite correction.


All QA commands used Node22 and the existing safeenv, with local sandbox escalation
for DB/Chromium. The real command was `QA_SOURCE=26e5e07 node independent/check.mjs`
(exit0) after `QA_PREFLIGHT_ONLY=1 node independent/common.mjs` (exit0). Root's
schema/backend checks use test-only Node auth/cache stubs outside requests; this
browser run used real auth, actions, persistence and tag/layout revalidation.

No old singleton snapshot/delete/restore, credentials/account/role changes, media
writes, Page edits, schema application, source changes, runtime manipulation,
main integration, push/deploy or remote writes by QA. Main/runtime delivery is
left to the orchestrator.
