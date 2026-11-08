# Settings WhatsApp FAB and Owners phone audit

2026-11-07. User requests floating WhatsApp reads Settings and audit whether Owners
phone +351910438062 appears in site/footer. Base main9866489, tracked clean; original
logo PNG/media symlink untracked preserved. Main dev3071PID75173/session15758 uses
synthetic propertylocalesqa DB5658/proxy4558/storage9077; preserve all files/worktrees.

Small two-source-file task stays with root under workflow simple-task exception.
Root owns settings/ui/components/whatsapp-fab.tsx and app/[locale]/layout.tsx;
Settings README, this execution and AGENTS docs. No new API/kernel/schema/packages.
Worktree /private/tmp/central-hill-settings-whatsapp-integration, branch
settings-whatsapp/integration. Existing app stays until verified candidate ready.

Current FAB hardcodes351910075725 independently of Settings; footer already reads
getGlobals(locale) and uses DEFAULT_GLOBALS only when singleton absent. Reuse this
exact distinction: absent row→DEFAULT_GLOBALS.whatsapp; existing blank/null→no
WhatsApp button. Owners floating link remains and existing layout/styles/newtab
attributes unchanged. LocaleLayout supplies validated locale. Cached getGlobals
already tagged SETTINGS_TAGS.globals; existing save revalidates all locale layouts.
No perpage Publish/DB writes needed, no custom replacement number invented.

Audit source/src/messages/scripts/docs/mock for alternate spacing/digits of
Owners phone; read-only scan42public business tables (no auth tables), host+SQL
DB/role propertylocalesqa guard. Do not add Owners phone field/footer row or change
numbers based on this review alone. Public current footer rows Phone(Bookings),
Check-in phone, Email, WhatsApp; Owners CTA is navigation, not separate phone.
Report current local/code coverage, do not claim remote production was reviewed.

Verification: typecheck/lint; DB-free actual-component SSR checks with temporary
loader fixtures for four locale propagation, changed/formatted number, absent
singleton default, explicitblank/null/nodigits, owner link preservation/newtab.
No implementation-mirroring permanent helper/tests; artifacts under
/private/tmp/central-hill-settings-whatsapp-qa. Full build2workers only in isolated
checkout, safeenv /private/tmp/central-hill-building-status-qa/env.sh (Node22), no
current singleton mutations. Independent bounded source/browser check production
3071 (four public locales +mobile, realSettings/default URL) after rootchecks;
no screenshots/aesthetic loops/expandedmatrix. QA owns only this task's QAmd and
own artifacts if delegated; no sourcefixes/listeners/DBwrites. Mainff local after
approval, soleactual-main3071 and finalreadonly opening. No push/deploy/remotes.

Inventory result: no Owners phone match in current code/messages/scripts/docs/mock,
and guarded read-only scan42business tables finds0matches. Current synthetic
company_settings singleton absent (the form/footer use defaults). No separate
Owners phone field or footer row exists. Owners contact fallback uses the general
Phone, not a dedicated number. No remote-production assertion. Audit evidence:
/private/tmp/central-hill-settings-whatsapp-qa/owners-phone-audit.json.

## Progress

Executable d38e77e: root handled two-source-file implementation as simple task;
no visual redesign or role refactor. Typecheck0/lint0(7oldwarnings), ten actual
component SSR cases0 via temporary external fixture loader (configured/custom
changes/four locales/missing default/explicitblanknull/no digits/Ownerslink/newtab).
No permanent helper/tests added for trivial plumbing. Safe isolated dependencies
installed offline/frozen; package/lock unchanged. Build underway with2workers;
main75173 remains live until candidate ready. Independent QA source/preflight
passed with no writes: company_settings0 and translations snapshot retained.

Build0/144routes/2workers; productionQA3071PID77358/session46392 after stopping
verified main75173. Independent QA05704f3 approved source d38e77e: one bounded
four-locale Guests +mobileEN pass,0pageerrors, correctdefaultWA/newtab and localized
Owners href, footerPhones Bookings351910075725/Checkin351912310632 and no Owners
phone. Settings/translation snapshots exact, no codefix/harnessretry/DBwrites.
Current singleton absent; configured/blank cases proved by actualcomponentSSR10
fixtures and source, not fabricated global Save. No remote-production claims.


## Local delivery

Main ff9866489→39b87ae after cleantracked check; original logo/media symlink
untracked preserved. QA77358/77352 stopped after cwd check. Sole actual-main
safeenv dev3071PID78758/parent78752/session68010 now active, cwdworkspace.
Read-only finalmainopening EN/PT Guests200, correctWA/newtab/Ownerslocalehref and
0pageerrors, main-open.json/log. No Settings writes, cacheintervention, sourcefix,
repeatmatrix or media writes. DB5658/proxy4558/storage9077 and all old files/
worktrees/caches/envs retained. Finaldoccommit resolved by gitlog-1; no push/deploy.
