# Settings navigation CTAs — executable plan

2026-11-07. Base main9fbace5 tracked clean, original logo PNG + publicmedia symlink
untracked preserved. User requests Book Now Label/URL EN/ES/PT/FR, Earn With Us
Label ONLY (follow-up explicitly forbids link editing). Earn is floating since
2026-11-04, not in current navbar; keep current location/link /owners. Book appears
desktop header/mobile drawer, fixed EN external URL for all locales. Labels come
from settings.ctaBook/ctaEarn messages. No schema needed; synthetic DB5658/proxy4558/
storage9077. Current actual-main dev3071 PID42358/parent42352/session97788 stays
until production candidate ready. No push/deploy/remote writes, local main delivery.

## Inventory and product contract

Main fallback navigation labels translated in messages; DB nav_item editable via
Navigation (URLs/order/nesting + EN source label), generic Translation still covers
its labels. Owners/About submenus contain fixed English labels, RealEstate/Guests
localized. User asks whether nothing else editable: explain these gaps, don't
silently convert nav_item/submenus or retire all Translations. Utility owner-login
URL, contact dialog copy, language labels/icons still fixed or independently owned.

ADR0073. New optional save input navigation_ctas has full en/es/pt/fr objects:
{book:{label,url},earn:{label}}. EN required nonempty label max80/URL max300HTTPS or
safe root-relative path. Target fields permit blank for corresponding EN fallback.
Edit initially prefills CURRENT values for all4 locales, preserving existing
translated labels and fixed booking destination. Once configured, raw target JSON
values including blank/pending loaded; missing target becomes blank for ENfallback.
Own targets survive EN changes. Old omitted payload preserves all CTArows exact.

One translation field navigation_ctas stores locale JSON via existing core seams.
EN setSourceContent JSON always nonempty (never cascade clears). Targets approved
by manual Save; target-public only approved valid values, fieldwise ENfallback.
No config => existing localizeddefaults; no readwrites/backfill. Globals cached
shapev5 adds optional navigationCtas to avoid old testfixtures breaking. Default
reader shared by public components and admin edit, server-only loads current
messages labels. Book newtab/noopener stays desktop/mobile, relative URLs locale-
prefixed; explicitly localized URLs and absolute HTTPS stay exact. Earn only label
changes on existing floating Link, preserving /owners and WhatsApp behavior.
Existing globals/layout invalidation refreshes4locales without PagePublish.
Generic Translation field-only guards exclude new field from review/inbox/single
writes/bulk/generate; Website guards and all other pending copy retain behavior.

## Owners / exact writable paths

Integration /private/tmp/central-hill-settings-navigation-ctas-integration branch
settings-navigation-ctas/integration. Root commits contract before writers:
navigation-cta-types.ts (schemas/types/constants/href), admin/validation.ts,
admin/queries.ts EditData optional type only, contract SiteGlobals/export, ADR/index/
thisspec. Root later owns messages4, Translation admin/{actions,queries}.ts,
server/generate.ts, new settings/manual-locale-fields.ts and exportcontract;
Settings/Translation README/data-model/roadmap/AGENTS, new pure+guard tests.

Backend /private/tmp/central-hill-settings-navigation-ctas-backend branch
settings-navigation-ctas/backend owns ONLY settings/admin/{actions,queries}.ts,
server/queries.ts, new server/navigation-ctas.ts, tests/navigation-ctas.integration.test.ts.
Exports defaultNavigationCtas(locale), navigationCtasForEdit(rows) returnsfull4,
resolveNavigationCtas(locale,rows), saveNavigationCtas(id,input?,updatedBy?). Helpers
resolve legacy fallback/source/rawtargetJSON per policy; default labels from current
messages (server-only import4JSON acceptable, don't add fullmessages to client).
Reuse alreadyloaded translationrows for edit (Website unaffected); public target
and EN raw rows loaded together to resolve JSON (reuse existingrowload). Save helper
after Website writes, omittedinput no-op. Cachev5. Own DBtests only new singletonIF0,
verify hostname propertylocalesqa.local AND db/role propertylocalesqa; refuse oldrow,
no snapshotrestore. Cleanup onlynewID+own translations. Keep all other data exact.

UI /private/tmp/central-hill-settings-navigation-ctas-ui branch
settings-navigation-ctas/ui owns ONLY settings/admin/ui/globals-form.tsx,
ui/site-header.tsx, ui/components/whatsapp-fab.tsx. Form one existingstyle card
Navigation buttons, Book Now subsection four language Label/URL pairs, Earn With Us
four Labels; no Earn URL, no tabs. StableIDs navigation-book-label-en / navigation-
book-url-en / navigation-earn-label-en (and es/pt/fr); requiredEN, max80/300,
associatedlabels/errors, disablebusy, preserve input onvalidation. Submit fulltrimmed
object. Inputs from initial.navigation_ctas, always supplied realruntime. Public
components fallback defaultNavigationCtas(locale) import helper; backend owns it,
wait integration for TS if absent. Book href navigationCtaHref fromtypes, same
resolved label/url desktop/mobile; Earn globals.navigationCtas.earn.label only.
No coreUI/schema/otherfiles. Impeccable launcher already ran this conversation;
read craft-floor before UI edits, incumbent form/CTAstyle authoritative. No aesthetic
QA/screenshots/polishloops. Root messages settings.admin.globals.navigationCtas:
title, intro, bookTitle, earnTitle, label({locale}), url({locale}), fallbackHint,
earnHint (fixed Ownersdestination). Root owns messages, request missingkeys.

Independent QA after integrated checks owns ONLY docs/specs/settings-navigation-
ctas-qa.md + artifacts, source readonly. Three bounded groups: settings12inputs/
noEarnURL/defaultlocalizedlabels/invalidURL/Save+reload;4locale actualdesktop/mobile
Bookhref+label/newtab and Earnlabel/fixedlocalizedOwnershref; ENchange + targetclear/
ENfallback/ownpreservation/olddata/auth. No broadPage/aesthetic or externalclicks.
Save only ownnew singleton after guardIF0; no schema/Page/media writes. Clean only
ownID+translations and compare42 protectedhashes. Root controls sole3071 transition
main→productionQA→actualmain, finalreadonlyopening. Keep allworktrees/artifacts.

## Checks

Root typecheck/lint; meaningful pure schema/resolver/default/href tests + real DB
Save/read/oldpayload/omission/targetfallback/neutralconfig tests serial with existing
Website+Owners regressions. External testonly auth/cache loader from priorQA. Root
fieldguard test oldgeneric write blocked/bulk+generation skip newfield, otherfields
unchanged. Build with safeenv CIRCLE_NODE_TOTAL=3 (2workers) only after DBcleanup.
No migration/dbcheck needed. Independent productionbrowser3groups, finalmainGET
only. Log results/source/runtime/delivery here; no automatic nextnavtask.

## Progress

Contracts114c337; root guards/labels d986dda. UI800d691 integrateddf35d3e and
backend5e79748 integrated776bab9. Backend typecheck/scopedlint0,7realDBgroups0
with ownrowcleanup; UI scopedlint0, initialTSonlymissingbackendhelper resolved by
integration. Root integrated typecheck0/lint0(7oldwarnings),69tests0 (46pure+23DB),
serialsingletonfiles: includes Owners/Website regressions and expanded manualfield
Translation guards. Root then tightened absolute URL syntax to explicit https://,
rejecting browser-relative https: forms;5focusedpure cases/scopedlint0 on final
rule, no API/type shape change. Fullbuild will check finalTS again. Alltests pass
without source corrections beyond that proactive syntax constraint before QA.
Exact rootcommands/logs under /private/tmp/central-hill-settings-navigation-ctas-qa.
No schema/migration. Main42358 still live while build prepares productioncandidate.

Final executable de04449; build0/144routes/2workers including final typecheck.
After DB cleanup root independently confirmed all42 hashes equal baseline and
Settings0. Oldmain42358/42352 stopped only after build; productionQA sole3071
PID68236/parent68230/session27979, integration cwd/login200 verified. Independent
QA began3boundedgroups against that unchanged source. Root no DBwrites duringQA.

Actual integrated test command (safeenv + NODE_OPTIONS require
/private/tmp/central-hill-property-forms-qa/node-runtime.cjs):
```sh
pnpm exec tsx --import /private/tmp/central-hill-geography-name-locales-qa/backend/test-runtime.mjs --test --test-concurrency=1 src/slices/settings/tests/settings.test.ts src/slices/settings/tests/settings-admin.test.ts src/slices/settings/tests/owners-phone.test.ts src/slices/settings/tests/owners-phone.integration.test.ts src/slices/settings/tests/website-locales.test.ts src/slices/settings/tests/website-locales.integration.test.ts src/slices/settings/tests/navigation-ctas.test.ts src/slices/settings/tests/navigation-ctas.integration.test.ts src/slices/translation/tests/settings-website-guards.test.ts src/slices/translation/tests/translation.test.ts src/slices/translation/tests/testimonial-quote-guards.test.ts
```
Root's expanded existing settings-website-guards.test.ts covers both manualfields
using one new random translationref, cleaned only its ownrows. Final5pureURLcases
rechecked after tightening syntax (url-final-tests.log); allotherpolicycases had
passed69integratedtests and finalbuild checks finalsource. No repeatedbroadQA.

Independent QA approved de04449:3/3bounded groups first run,0pageerrors, no product
or harness corrections. Real Settings Save/reload,12inputs/noEarnURL, validation/
auth,4locale Book label/href/newtab and Earnlabel/fixedOwnershref, ENchange/target
blankfallback/ownpreservation, mobile4drawers+Save/reload, genericreviewfieldmask
allpass. One ownfixture7e985efb-1efc-40f5-9b70-69c88159711b reset+cleaned onlyits
row/translationrows, Settings0 and42hashes exactly baseline; root independently
compared JSON. Existing Pages/media/contacts/nav untouched. SourceunchangedafterQA.
