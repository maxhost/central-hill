# Central Hill agent instructions

## Final Translations readiness review —2026-11-08

User asks if global Translations can retire after Settings. Source audit at0abdf0b
finds city.intro has NO current public renderer: Geography DTO reads it but Guides
reduces city toid/name/slug; Guide intro is a separate alreadylocalized field. Do
not present city.intro as needing another public editor. Preserve legacy rows.
Only unresolved product policy is shared media ALT: some Pages/Blog body images
already have own alt fields, but covers/galleries/Guide media/OG still read asset
ALT through core i18n. Global review edits existing targets, upload has no source
ALT field. Choose per-image manual editing or existing-values/automaticfallback
policy before removing its last UI; do not invent a mandatory media-library task.
Then technical retirement of legacy routes/actions remains, with all stored data
kept. Read [audit](docs/specs/translations-final-closeout-review.md) and masterplan.
No code/DB/schema/tests/browser/restart in this review, actual-main3071 PID13559/
parent13553/session19738 retained. No automatic global removal pending ALT policy.

## Settings Hours Labels and cleanup —2026-11-07

User requests editable Hours Label EN/ES/PT/FR and removes unused Settings blocks.
Candidate e76c88c (productd53a321) in settings-cleanup/integration at
/private/tmp/central-hill-settings-cleanup-integration. Read
[execution](docs/specs/settings-hours-cleanup.md),
[QA](docs/specs/settings-hours-cleanup-qa.md), ADR0075. Four rawHoursLabels/one shared
schedule; ENinline canonical, approvedtarget→nonblankEN→locale default, ownlabels
surviveENedit/clear, omittedtargets preserve; no legacyENrow mirror/delete. Onlyblank
schedule gets defaultlocalizedweekdays withsame09:30–18:00; authoredschedule exact.
About explicitlocale, Globalscachev6/existingrevalidation/noPagePublish.

Headline stats/Avantio/Buildings listing cards removed: no activepublicconsumers of
those Settingsfields, actualHomeAvantio widget remainsfixedbk_centralhill. Retired
columns/stat+ENhours translations preservedexact; staleinputs ignored/newsingleton
fills internaldefaults. SiteIcons staysACTIVEglobalUI/defaults (navbar/Blog/Guides/
apartment specs and sevenServicefallbacks), only3unusedservices_how_*controls removed;
activekeymerge preservesrawhidden/unknownicons. Wholecompany_settings retiredfrom
S14inbox/actions/generator/review, oldreviewredirectSettings, originalrows intact.
RemainingglobalTranslationwork ALT/city.intro/legacycloseout, no automaticnexttask.

Twoisolatedwriters integrated; root102tests0/typecheck0/lint0(7oldwarnings), allown
fixturescleaned/Settings0/42oldhashesexact. IndependentQA readonlypreflightpasses,
build0/144routes/2workers. Oldmain75584/75578 stopped; soleproductionQA3071
PID12985/parent12979/session95475 integrationcwd/login200verified. IndependentQA approvede76c88c/productd53a321:3boundedgroups firstpass/0pageerrors,
no fixes. Onlyownfixture9a9b12fd-52e2-46bf-8c43-0809692cdf3c+owntranslations cleaned,
Settings0/42oldhashesexact/rootcomparedJSON. QA reportca698c8; mainff7c1a205→31deec4.
Candidate12985/12979 stopped. Sole actual-main dev3071 **PID13559/parent13553/
session19738**, workspacecwdverified. Finalreadonly Settings200/4HoursLabels/
no3legacycards/activeicons, AboutEN/PT200/localizeddefaulthours, oldSettingsreview
->Settings/globalTranslations200/0pageerrors. main-open.json/main-restart.log in
/private/tmp/central-hill-settings-cleanup-qa. No Save/cacheintervention/repeated
matrix afterQA; Settings0 remains, finaldoccommit via gitlog-1. Safe DB5658/
proxy4558/storage9077. No schema/migration/remoteDB/push/deploy. Preserve all files/
worktrees/envs/caches/artifacts/logo/publicmedia symlink.

## Review correction: statistics and hours —2026-11-07

User questions remaining Translation blockers. Read-only code audit on7615b58
confirms public Home/Owners/Buildings/About/RealEstate statistics belong to visual
Pages editors per locale. company_settings.stats is legacy; its sole StatsBand
composer has no callers. Do NOT present statistics as missing localization coverage
or propose another editor. Old Settings inputs/write paths need eventual technical
retirement while preserving data, not new authoring UI. Hours numeric range is
shared/not[T]; the actual active About dependency is office_hours_label (“Office
Hours”) plus English weekday fallback (“Monday–Friday”). A fixed translated heading/
day template can resolve that small text without another schedule editor. About
editor currently lacks hours label/value; other office labels are editable there.
Read [review](docs/specs/settings-stats-hours-review.md) and corrected masterplan.
No implementation/DB/schema/tests/browser/restart in this review; actual-main3071
PID75584/parent75578/session24974 stays. ALT/city.intro/legacy closeout decisions
remain; do not silently implement cleanup or delete legacy fields/data.

## Fixed multilingual navigation —2026-11-07

User fixes public navigation text/order/links in code, translates Owners/About
submenus EN/ES/PT/FR and retires Navigation + its generictranslation workflow.
Canonical code trees preserve current header6items, Owners10/About8/RealEstate10/
Guests2 sublinks and Footer2groups×5links. getNav API now fixed-v1cached code/messages
only, no nav_item/translation reads. Header/mobile/Footer consume same data; styles,
BookSettings label/URL, floatingEarn label/fixedOwnerslink, contacts/widgets intact.
Navigation sidebar removed; old gated /admin/navigation and nav_item review URLs
redirect Settings. Legacy saveNavigation auth→validationdenial; all6 genericnav
mutations/rawgenerator/inbox/entityreview blocked. Historical navrows preserved,
no schema/backfill/deletion. ADR0074 supersedes old navigation-builder notes.

Global Translations remains: Settings stats/hours, ALT, city.intro policy and old
Services/Amenities/categories/FAQ/geo write-path closeout still pending. User asked
readiness, not automatic implementation of all those editors/policies. Explain
Navigation retired while global removal needs remaining decisions/work. Preserve
translation/kernel tables and all oldlocalized data; no further task automatically.

Read [execution](docs/specs/fixed-public-navigation.md) and
[QA](docs/specs/fixed-public-navigation-qa.md). Integration
/private/tmp/central-hill-fixed-navigation-integration branch fixed-navigation/integration,
executablefa6b0f6, twoisolatedwriters +approved extraTranslationtestfile forboundaries.
Root88tests0/typecheck0/lint0(7oldwarnings),42oldbusinesshashesexact/Settings0/nav0
postcleanup. Only ownsyntheticnavrow/translationrefs cleaned. Build0/144routes/
2workers. IndependentQA source/read-onlypreflightpasses; browsergroups underway
on solecandidate3071 PID72352/parent72346/session24919, integrationcwdverified.
Oldmain68928/68922 stopped. All browser cases passed except a confirmed pre-existing
keyboardtransfer bug. Root4635f0b fixes ONLY shared globals.css hide selector
(ADR0074): preserve transientfocus-within during Tab/ShiftTab, retain mouseclose.
Correctedbuild4635f0b0/144routes/2workers in separate keyboard-runtimecheckout.
Old72352/72346 stopped; solecorrectedproduction3071 PID74078/parent74072/
session27579, cwdkeyboard-runtime/srcdiff0/sourceverified, login200. IndependentQA approved4635f0b:10/10targetedkeyboard/mousecases0errors, P2resolved;
allother3readonlybrowsergroups retained,42oldhashesexact/rootcomparedJSON. No more
DBfixtures or fullmatrixrepeat. QA report4779469; mainff37a553f→ae581de. Corrected
candidate74078/74072 stopped. Sole actual-main dev3071 **PID75584/parent75578/
session24974**, workspacecwdverified. Finalreadonly main-open0: AboutEN/PT200/
18localizedOwners+Aboutlinks/BookEarnintact, Navigation/navreview->Settings with
noNavigationlink, globalTranslations200,0pageerrors. Evidence main-open.json/
main-restart.log under /private/tmp/central-hill-fixed-navigation-qa. No Save/
cacheintervention/repeatedmatrix afterQA; finaldoccommit via gitlog-1. Safe
propertylocalesqa DB5658/proxy4558/storage9077 retained. No migration/remoteDB/push/
deploy. Preserve all worktrees/envs/caches/artifacts/original logo/publicmedia symlink.

## Settings Book Now / Earn With Us locales —2026-11-07

User requests Book Now Label/URL EN/ES/PT/FR; correction explicitly limits Earn With
Us to Label ONLY. Earn stays floating with locale-aware /owners destination, no
link control/reintroduction in navbar. One Settings card, Book4label/URLpairs +
Earn4labels, current localized defaults prefilled, no tabs. Target blanks use EN
per field; own values survive EN changes. EN required. URLs HTTPS/max300 or safe
root-relative paths; Book keeps newtab/noopener on desktop/mobile and locale-prefixes
neutral internalpaths, preserving explicit locale/absolute URLs. Earn/WhatsApp
links/positions unchanged. Page booking buttons/widgets/navigation tree unchanged.

No schema/migration: translation company_settings.navigation_ctas JSON perlocale
{book:{label,url},earn:{label}} through existing core write seams. EN JSON always
nonempty; target manualSave approved; rawpending/invalid values editable, public
approvedvalid fields only else EN. Missingconfig retains original localizedlabels
and fixedENbookingURL; old omittedpayload preserves rows exactly. Globalscachev5,
existing layout invalidation updates public without PagePublish. Only Website+
newCTAfield excluded from genericTranslation, not Stats/hours/nav_item. Main menu
fallback translated; Owners/About submenus still contain fixedEnglishlabels and
Navigation still edits links/order. Those gaps remain separate tasks.

See [execution](docs/specs/settings-navigation-ctas.md),
[QA](docs/specs/settings-navigation-ctas-qa.md), ADR0073. Two isolated writers,
executablede04449. Root69tests0(46pure+23DB)/typecheck0/lint0(7oldwarnings), final
URLsyntax5pure/scopedlint0, build0/144routes/2workers includingfinalTS. Testsusedonly
newsynthetic rows cleaned,42oldbusinesshashes exact/Settings0 beforebrowserQA.
Independent QA approvedde04449:3boundedgroups firstpass/0pageerrors, no fixes.
Onlynewfixture7e985efb-1efc-40f5-9b70-69c88159711b and owntranslations cleaned,
Settings0/all42hashes exact (root compared JSON). QA report6272293; mainff9fbace5→64cc24b. Candidate68236/68230 stopped. Sole
actual-main dev3071 **PID68928/parent68922/session43161**, workspacecwd verified.
Finalread-only Settings200/12inputs/noEarnURL, AboutEN/PT200/defaultBook+Earnlabels/
fixedlocalizedOwnershref,0pageerrors; main-open.json/main-restart.log in taskQA.
No Save/cacheintervention/repeatedmatrix, Settings0 remains; finaldoccommit via
gitlog-1. Safe DB5658/
proxy4558/storage9077. No schema/remoteDB/push/deploy. Preserve worktrees/artifacts/
ignored envs/caches/original logo/publicmedia symlink. Furthernav/submenus/copy/ALT/
city.intro/Translations closure and rolecleanup await a new task.

## Website EN/ES/PT/FR in Settings → About —2026-11-07

User requests four Website URL inputs in Settings Contact, About office panel uses
its public language. Canonical EN remains inline website_url; targets reuse existing
translation rows. Blank target follows current EN; own target survives later EN
change/clear and may exist with ENempty. Raw authored/pending targets load as-is,
manual Save approves targets, blank deletes only selected Website target; old
clients omitting targets preserve them. Legacy EN translation rows preserved but
ignored; no mirror/backfill. Public only accepts approved valid HTTPS target,
else inlineEN. Four inputs/oneSave/noTabs, existing form/controls and contacts intact.
About exact href/visible text already consumes getGlobals(locale).website; cache
shapev4 and existing global/layout invalidation update it without PagePublish or
SEO/content/revision changes. Missing singleton keeps old About Websitehidden.
No singleton is seeded merely for the final UI; admin can fill and Save Settings.

ADR0072, [execution](docs/specs/settings-website-locales.md) and
[QA](docs/specs/settings-website-locales-qa.md). Only Website is excluded from the
generic Translation inbox/review/single actions/bulk/generator; Stats/hours remain
there. No schema/migration/kernel API or roles change. No remoteDB/push/deploy.
Two isolated writers integrated into fda13a4. Typecheck0/lint0(7oldwarnings),57tests0
(41pure+16DB, singleton files serial), build0/144routes/2workers. Independent QA
approved source fda13a4:3bounded groups/0pageerrors, all42 oldbusiness hashes exact.
Three own temporary Settings setups and only their translations cleaned, singleton0.
Harness selector/case fixes only, no product correction. QA report9f2f34a; main
ff933becc→2f0739f. Sole actual-main dev3071 **PID42358/parent42352/session97788**,
workspace cwd verified, safe DB5658/proxy4558/storage9077 preserved. Candidate
40169/40163 stopped. Final read-only Settings200/4inputs and AboutEN/PT200 with
old absent-singleton Websitehidden behavior,0pageerrors; main-open.json and
main-restart.log in /private/tmp/central-hill-settings-website-locales-qa.
No Save/cacheintervention/repeatedmatrix after QA. Finaldoccommit via gitlog-1.
Preserve all worktrees/artifacts/envs/original logo/publicmedia symlink/caches.
Other Settings copy/navigation/ALT/city.intro/legacy retirement and Admin-only role
cleanup remain separate; do not start another task automatically.

## Owners phone in Settings and Footer —2026-11-07

User requests independent Owners phone input and footer row, using +351910438062.
Delivered nullable owners_phone (0029) with supplied initial default; optional
Contact input, shared across4languages, localized Owners/Propietarios/Proprietários/
Propriétaires footer row after Bookings, tel link and existing icon. Blank/null
hides only Owners row, no default revival. Missing singleton uses DEFAULT_GLOBALS.
Old clients omitting key preserve custom/null; new UI posts trimmedstring/null.
Bookings/Checkin/WhatsApp and About/Owners CTA contacts unchanged. Reader cache
shapev3 avoids old objects missing new field. ADR0071 owns additive optional
FooterContact props/core rendering; no unrelated role/localization refactor.

User explicitly authorized0029 onlypropertylocalesqa5658. Root verified host+SQL
DB/role, appliedoneALTER, inspectednullable/default and proved42oldbusinesshashes
exact (excludeonlynewattribute). No remoteDB migration. Snapshot0029 completed
before finaldbcheck; SQL/hash unchanged, no reapply. Read
[execution](docs/specs/settings-owners-phone.md),
[QA](docs/specs/settings-owners-phone-qa.md), ADR0071 and migrationartifact under
/private/tmp/central-hill-owners-phone-qa/. Two isolated writers integrated. Source
26e5e07 independentlyQA approved2e77d51:3bounded realbrowser groups,0pageerrors,
Save/reload/change/clearNULL/no revival across4locales/mobile/auth, othercontacts
and neutralsettings unchanged. Only newfixturee95b36ec-e09e-478d-8e4e-ba9984ebfd40
and its translations cleaned; table returns0,42hashes equal premigration. No old
singleton snapshot/delete/restore or Pages/media writes.

First Save had an existing blocker: missing-singleton scaffold required an Avantio
account but defaulted empty. DEFAULT_GLOBALS now prefills the ALREADY-used widget
account bk_centralhill (server/avantio-widget.ts), not fake configuration. Stored
IDs and widget scripts/URLs/booking behavior unchanged. Full defaultpayload test+
real firstSave passed. Final32tests0 (26pure+6DB), FooterSSR8cases0, typecheck0/
lint0(7oldwarnings), db:check0(30migrations,old0008warning), correctedbuild0/144routes/
2workers. Earlier build archivedbefore-scaffold; no QA retries/product fixes inQA.

Main ff064554c→2da8ff2 done. Sole actual-main dev3071 **PID97374/parent97368/
session54450**, cwdworkspace, existing safe DB5658/proxy4558/storage9077 unchanged.
QA96139 stopped. Final readonly mainSettings200 prefills Ownersnumber; GuestsEN/PT
200 footer3numbers/WA correct,0pageerrors (main-open.json). No new Save/cache
intervention/repeatedmatrix at final opening. Finaldoccommit via gitlog-1.
Preserve all worktrees/files/artifacts/ignored envs/logo/publicmedia symlink/caches.
No push/deploy. Further Settings locales/Navigation/ALT/Translations retirement
and Adminsingle-role removal remain pending; do not start another task automatically.


## Floating WhatsApp uses Settings / Owners phone audit —2026-11-07

User requests floating WhatsApp reads Settings and checks Owners +351910438062.
Small task root-owned two source files, executabled38e77e; WhatsAppFab receives
validatedlocale from LocaleLayout and reads cached getGlobals(locale). Missing
singleton uses DEFAULT_GLOBALS.whatsapp (same as footer); configuredblank/null/
nodigits hides onlyWhatsApp, Ownersfloating navigation remains. URL digitsnormalized,
newtab/noopener preserved, styles unchanged. Existing Settings Save tag/layout
revalidation covers all locales. No newAPI/kernel/schema/field/DBcontent writes.

Read [execution](docs/specs/settings-whatsapp-fab-owners-phone.md) and
[QA](docs/specs/settings-whatsapp-fab-owners-phone-qa.md). Typecheck0/lint0(7oldwarnings),
10actual-componentSSRfixture cases0, build0/144routes/2workers. IndependentQA05704f3
approved one bounded fourlocale+mobileEN pass,0pageerrors; Settings/translation
snapshots exact, no sourcefix/harnessretry. Current singleton absent; realpublic
usesdefaults. Configured/blank variants proven by SSRfixtures/source, no fake
singleton/Save or existingPage mutation. No screenshots/aestheticloop/broadmatrix.

Ownersnumber has0matches in current src/messages/scripts/docs/mock and guarded
readonlyscan42business tables. Footer has general Phone(Bookings),Checkin,email,
WhatsApp, no Ownersphone row/field. Ownerscontact fallback also general Phone.
No new Ownersnumber assigned or remoteproduction claim. Artifact audit under
/private/tmp/central-hill-settings-whatsapp-qa/owners-phone-audit.json.

Main ff9866489→39b87ae done. Sole actual-main dev3071 **PID78758/parent78752/
session68010**, cwdworkspace; safe propertylocalesqa DB5658/proxy4558/storage9077
retained. QA77358 stopped. Finalreadonly GuestsEN/PT200 shows correctWA/Ownershref/
newtab,0pageerrors (main-open.json); no cacheintervention or newmatrix. Finaldoc
commit via gitlog-1. Preserve all files/worktrees/artifacts/envs/logo/media symlink.
No remoteDB/push/deploy. Adminsingle-role removal, otherSettingslocales and new
Ownersphonefield remain unstarted; follow next request.


## Local Admin access / single-role requirement —2026-11-07

User clarifies product has ONE staff type, Admin; inherited admin/editor/translator
from initial scaffold is not the desired product model. Full removal is pending,
not implemented by the temporary access change below. Do not justify legacy role
restrictions as a current product requirement or start the refactor automatically.

User explicitly authorized promoting the currently connected local account to Admin
to inspect Settings. Host + SQL DB/role propertylocalesqa verified. The only account
with active sessions is property-locales-qa (Property QA), matching the existing
local authenticated session. Updated only its staff_role row Editor→Admin; all
other role rows unchanged, no credentials/session/content/schema changes. Read-only
browser verified topbar Admin, Settings+Navigation sidebar links, /admin/settings
200 with Company settings form. Reload existing browser to refresh the layout.
Audit identity/before-role/result under /private/tmp/central-hill-local-admin-access/
(no tokens/passwords copied). Main dev3071PID75173/session15758 retained; no restart,
remote DB action/push/deploy. This authorizes the one local grant, not arbitrary
other account grants or a production role/schema migration.


## Latest Testimonial Quote inputs —2026-11-07

User requests Quote EN/ES/PT/FR in same ficha, blank uses EN, public follows page
locale. Delivered four textareas/no tabs/one existing Save; only Quote translated.
Author/country/property_location/audience/rating/status/position remain shared.
Edit loads raw pending/authored targets with missing blanks, manual nonblank Save
approves targets, blank clears only that locale Quote. Later EN keeps own targets;
old clients omitting targets preserve raw rows exactly. EN trimmed/required/max1000,
targets trimmed/max1000. Existing locale/audience/public cache readers unchanged;
Save invalidates testimonial-list without marketing Page JSON/pub/SEO changes.
Generic testimonial Translation inbox/actions/generation retired; old reviews
redirect to its ficha. No legacy deletion/backfill/GET writes or migration.

Read [execution](docs/specs/testimonial-quote-locales.md),
[QA](docs/specs/testimonial-quote-locales-qa.md), ADR0070 and updated roadmap.
Two isolated writers integrated executable1cb2ec8; independent QA1953030 approved
3bounded production-browser groups,0pageerrors, no product fixes/harness retries.
Root33cases0 (27pure+6DB), typecheck0/lint0(7oldwarnings), build0/144routes/2workers
after e830 cleanup. 42protected business hashes equal preseed; fixture neutralrow/
ownerquotes/slugs exact. Guests4 public quote/fallback/audience suppression verified;
Home currently intentionally omits testimonials and synthetic Owners page absent,
so no invented public coverage/new Page fixture. Owner reader/filter tested4locales.
Only new e831guest+owner and draftb58049c1-f090-42f2-aa18-6b98adb777ac retained,
no media writes or fixedPage changes. Existing synthetic DB authorization reused.

Main ff a321f2d→495b9a9 done. Sole actual-main dev3071 **PID75173/parent75167/
session15758**, cwd verified workspace, safe propertylocalesqa DB5658/proxy4558/
storage9077PID30456 retained. QA74283 stopped. Main read-only opening passed New/
Edit4Quotes/rawvalues, oldreviewredirect, GuestsEN/PT visible localized quotes and
owner suppression,0pageerrors. Evidence main-open.json and logs under
/private/tmp/central-hill-testimonial-quote-locales-qa/. No cache intervention,
repeated matrix or source changes after QA. Finaldoccommit via gitlog-1.
Preserve all worktrees/artifacts/files/ignored envs/logo/publicmedia symlink and
prior cache archives. No schema/remote writes/push/deploy. Global Translations
remains: Settings/navigation/ALT, city.intro policy and remaining legacy-path
retirement pending; do not start further work automatically.


## Latest City/neighbourhood name inputs —2026-11-07

User requests EN/ES/PT/FR inputs in the existing City ficha and every inline
neighbourhood, like Amenities, only names and no slug localization. Delivered
with one Save/no tabs: raw authored/pending targets, manual nonblank names approved,
blank targets use EN fallback per field. Later EN changes keep own target names.
Building/Guide tabs change labels with the same selected IDs; public readers and
Guide city filters follow locale without republishing consumers. One shared slug,
image, country/status/position/identity retained. Name-only Saves skip ALL slug
writes (including legacy custom PT URLs) and unchanged intro writes. Actual EN
intro edits reuse source-only clear protection; no target intro controls added.
New inline neighbourhood IDs are adopted after Save, so a second Save retains
identities even after add/remove/reorder. Existing sequential writes retained.

Read [execution](docs/specs/geography-name-locales.md),
[QA](docs/specs/geography-name-locales-qa.md), ADR0069 and entity-locale roadmap.
Two isolated writers integrated executable e11dfcf; QA74cc9db approved 3 bounded
production-browser groups, 0pageerrors. Root36cases passed (29pure/7DB), typecheck0,
lint0 (7oldwarnings), build0/144routes/2workers after e820 cleanup. All42 protected
business hashes equal preseed; exact fixture slug/intro/Building+Guide+section/
translations/locale+shared/SEO/reference snapshots unchanged. No product correction
in QA; only response-body harness capture adjusted after refresh, continued from
already-completed Save. e821 and new69c3994c City aggregate retained; d300media
read-only, no uploads. No schema/migration or remote writes.

Main ff983ca51→4391123 complete. Sole actual-main dev3071 **PID70494/parent70488/
session75835**, cwd verified workspace; safe propertylocalesqa DB5658/proxy4558/
storage9077PID30456 unchanged. QA69672 stopped. Main-opening read-only passed City
New/Edit, Building+Guide fourtabs/sameIDs and EN/PT public URLs, 0pageerrors;
evidence main-open.json under /private/tmp/central-hill-geography-name-locales-qa/.
Final harness initially compared case-sensitive innerText against the Hero's CSS
uppercase. DOM/textContent and visible nodes were correct; normalized-case check
passed. No cache defect, .next archive/restart or product/content fix was needed.
Preserve all files/worktrees/artifacts/ignored envs/logo/publicmedia symlink and
previous cache archives. Final documentary commit resolves with gitlog-1.
No push/deploy. Generic Geography Translations remains because city.intro policy
is outside this names-only change. Testimonials/Settings/navigation/ALT and legacy
path retirement remain pending; do not start further work automatically.


## Latest per-language Page FAQ selection —2026-11-07

User requests FAQ selection in EACHlanguage, explicitly no EN inheritance.
Home/Owners/RealEstate/Guest/About now expose same native selector in EN/ES/PT/FR.
Each existing snapshot owns faq_group_key; missing/blank means noFAQ for that
language, never ENfallback. Existing saved/legacy choices retained, no eagerclear/
backfill/GETwrites. Descriptor localeReferencePaths separates references from [T]
texts and shared media/layout. Target prepare retains own key/blank/absence, and
shared guard permits only declared references while media/list/OG/CAS stay intact.
SaveDraft/Publish remain explicit per locale; other pending choices/drafts/pubs
survive ENchanges. Existing public/preview read selected envelope. FAQ editor and
its source/legacy translations unchanged: admins can author separate groups per
language and choose them here. GenericFAQTranslation retirement is later technical
work, not performed; globalTranslations remains. No newFAQsections on otherPages.

Read [execution](docs/specs/page-faq-locale-selection.md),
[QA](docs/specs/page-faq-locale-selection-qa.md), ADR0068 and updatedroadmap.
Two isolated writers integrated executablee9f0cab; QA f2b9d73 approved3bounded
browsergroups +read-only clearedES/FR200.0pageerrors,42business hashes identical
from beforeseed throughstore+browser; Aboutsource and FAQ groups/items/translations
immutable. Focused57pure+5DB=62pass, TS0/lint0(7oldwarnings), build0/136pages/2workers.
Broad206batch195pass/11fail: SAME11stale layout/copy/hidden-node expectations
reproduced in untouchedmainfc609a8 (150baseline138pass12fail incloldAvantiooutline).
Only obsoleteHomeAvantioexpectation aligned, no related productchange. Do notclaim
wholebroad suite green or silently start unrelatedrepairs. No productcorrection
inQA; harness summary+span and preview-ready/hydration timing adjusted targetedly.

No schema/migration/remote writes. TestnewOwners/e810 guardedabsent then cleaned;
newAbout/e811+4FAQgroups retained, no media writes. Home/oldPages/FAQ protected;
never snapshot/delete/restore existing fixedPagekeys for tests. Source inventory
beforetask blog/buildings/guest/guides +Home4localeunits, Owns/About wereabsent.
Main ff fc609a8→45bd1cf complete. Sole actual-main dev3071 **PID49382/parent49376/
session31847**, cwd verifiedworkspace; main-openreadonly200 About/Home4enabled
selectors andSQLsnapshotvaluesmatch,0errors. Mainfirststart49284 had old FAQcatalog
cache predatingSQLseed (only2groups); stopped and archived ENTIRE .next intact to
/private/tmp/central-hill-page-faq-locales-qa/main-next-before-faq, no files deleted.
Freshdev fixeslocalcache; no contentwrites/productchanges or repeatedmatrix.
QA46574 stopped. DB5658/proxy4558/storage9077PID30456 unchanged. Preserve all
worktrees/files/ignoredenvs/originallogo/publicmedia symlink and newcachearchive.
Logs/evidence /private/tmp/central-hill-page-faq-locales-qa/. Finaldoccommit via
 gitlog-1. No push/deploy. Cities/barrios/testimonials/otherauxiliaries remain
unstarted; follow next userrequest.

## Latest Blog author/category locale inputs — 2026-11-07

User requests four inputs per language in the SAME ficha, no tabs: author name
and bio EN/ES/PT/FR, category name EN/ES/PT/FR. Delivered with one existing Save,
raw pending targets in inputs, nonblank manual targets approved and blanks using
EN fallback per field. Omitted target payload preserves old clients. Author/
category identities/shared slug/avatar/status/color/position stay intact. Post
selectors show active-language labels with same IDs; public detail/list/category/
related/JSONLD/privatepreview follow post locale. Renames/clears update public
without republishing posts or changing their snapshots/revisions. EN bio clear
preserves own target bios; explicit core preserveTargetsOnClear opt-in (ADR0067)
leaves default old clear-all behavior unchanged. ENnames reject whitespace-only.
Generic Translation inbox/actions/generator exclude author/blog_category; old
links redirect to their fichas, no rows deleted. Global Translations remains.

Read [execution](docs/specs/blog-reference-locales.md),
[QA](docs/specs/blog-reference-locales-qa.md), ADR0067 and entity-locale roadmap.
Two isolated writers integrated executablec155184; independent report42b9ca7
approved3bounded browser groups,0pageerrors,42protected business hashes identical
from beforeseed throughstore+browser. Posts/pubs/revs/IDs/neutralrefs intact.
Root59tests0 (54pure+5DB), typecheck0/lint0(7oldwarnings), build0/136pages/2workers.
No schema/migration, remote writes or aestheticQAloop. Only harness expectation
adjusted (JournalCard has no authorbyline); no product fix in QA. e800tests cleaned;
e801 + newauthor32f7330c-3e42-477e-a053-84bea16ad0d5/category8e4e5605-dce4-4360-
8cb6-9569bb94303d retained, no media writes. Rootlegacy ENtrim correction beforeQA
covered by pure assertions. Cities/barrios explicitly deferred by user; do not
start those, FAQ/testimonials or other auxiliaries automatically.

Localmain ff6445c99→05c696b done; final doc commit resolves via gitlog-1. Sole
actual-main dev3071 **PID35581/parent35575/session36923**, cwd verifiedworkspace;
main-open read-only200 Author/Category/New forms +Post:4names/4bios author,
4categorynames/noTabs, Post4tabs/sharedIDs,0errors. Safe synthetic propertylocalesqa
DB5658/proxy4558/storage9077PID30456 unchanged. QA31418 stopped. Keep all worktrees,
files/artifacts/ignoredenvs/originallogo/publicmedia symlink. Logs/evidence in
/private/tmp/central-hill-blog-reference-locales-qa/. No push/deploy/remote writes.

## Latest Guides locale forms delivered — 2026-11-06

User authorized individual Guides as next step toward retiring Translations.
Delivered complete FORM aggregate with EN/ES/PT/FR tabs, same approved Services/
Building toolbar placement and public link in new tab. Sections AND places can
be composed before firstSave. SavedEN feeds untouched locales until actual own
localized edit; draft/Publish explicit per locale, other pending tabs preserved.
Root/section/place photos + physical/settings maps shared by stable UUID, including
target-only pending nodes; saved history retained, never-saved orphans pruned.
Conditional modules, SEO/slugs, public city gating, TOC/gallery/recommendations and
legacy approved/pending data preserved. Archive/Restore retains publications/drafts.
Old Guide translation links redirect to its locale form; generic inbox/actions/
generation exclude guide_page/section/place. Global Translations remains active;
auxiliaries and other legacy inbox retirement remain future work, not authorized
by this delivery. Read [execution](docs/specs/guide-locale-forms-execution.md),
[QA](docs/specs/guide-locale-forms-qa.md), ADR0066 and updated entity-locale roadmap.

Two isolated writers integrated into executable2ad160d; independent QA0323617
approved4bounded browsergroups + cross-tab unsaved/publicpopup confirmation.
Root106testgroups0 (67Guides+25consumers+14model/DB), typecheck0, lint0/7oldwarnings,
dbcheck0/old0008warning, build0/125pages using2workers. No product correction or
visual QA loop. Migration0028 explicitly approved ONLY propertylocalesqa DB+role,
two empty additive tables/no backfill.42protected browser hashes same;40oldbusiness
hashes identical from beforemigration throughstore+browser. e790 cleaned; newe791/
540d6549-0a31-427a-9093-2e0e8a0931bd demos +4ownmedia retained, IDs inQAartifacts.

Localmain ff97fa285→f5cdb12 completed, final documentation resolves via gitlog-1.
Sole actual-main dev3071 **PID8218/parent8212/session41807**, cwd verifiedmain;
read-only main-open200 Existing/New:4tabs/toolbar, ENfirst, localSection+Place
beforeSave,0pageerrors. Safe syntheticDB5658/proxy4558/storage9077PID30456 unchanged.
QA candidate99043 stopped; all worktrees/files/artifacts/ignoredenvs/originallogo/
publicmedia symlink preserved. Evidence/logs /private/tmp/central-hill-guide-locales-qa/.
No push/deploy/remote writes. No automatic auxiliary/Apartment lifecycle work next.

## Latest Building/Services header consistency — 2026-11-06

User accepted Services against Building e751 and authorized local main commit.
Completed visual follow-up: Service title/status badge + View on site at top right
(new tab, noopener noreferrer), catalogue back control, same sticky action row
above language tabs as Building (Archive/Delete left, Save draft/Publish
right; only Publish accented), matching max-w-3xl editor width. Removed duplicate
Status card/label; Position retained beside Category in Identity. Existing handlers,
locale/media/persistence and action disabled conditions preserved. View on site
wording aligned in4locales. AestheticL0: no tests, automated QA, DBwrites, restart,
push/deploy; user manual review approved. Existing main3071 PID44149/session88324
kept live without restart. Local documentary/UI commit resolves through gitlog-1.
Follow-up: Building Delete moved from the bottom beside Archive/Restore in its
upper toolbar, preserving confirmation/busy state/reference guard. Services Cancel
removed; catalogue back navigation and unsaved-work protection retained.
Original logo/publicmedia symlink, synthetic env and all worktrees/files retained.
User asks remaining plan specifically to retire /admin/translations. Roadmap top
in docs/specs/entity-locale-editors-spec.md updated from source + read-only local
DB/role aggregate: phase4Guides + auxiliary editors (Blog authors/categories,
geography, generalFAQ, testimonials, globals/nav and mediaALT) remain; Services,
Amenities and Service categories need legacy inbox/route/action retirement, not
new language forms. Keep translation storage/kernel and old data. This is an audit
and plan update only; no next implementation or global Translations removal is
authorized by this question. Automatic translation and Apartment lifecycle remain
separate/deferred. No production DB inventory or remote writes.



## Latest Services locale forms delivered — 2026-11-06

User authorized implementation from checkpointb1b75d7 and delivery on localmain.
Completed executablea541f4e; independent QA reportb331653 + addendumc4cd07f.
Read [execution/inventory](docs/specs/service-locale-forms-execution.md),
[QA](docs/specs/service-locale-forms-qa.md), ADR0065. Keep Service FORM/modules:
EN/ES/PT/FR, savedEN inheritance until actual localized edit, independent drafts
and explicit Publish; text/SEO/booking label+URL remain owned. Shared images,
category/icons/neutral settings live onSave; category/icons chosenEN, enforced
server. Facts/itinerary stable ids join common icons/media byid, including target-only
rows; never-saved orphan slots pruned, saved histories preserved. Four manual
category name inputs reuse core translations; raw pending loads, approved Save,
blanktargetENfallback, shared categoryID + localized selector/public names.
SEO/publications/slugs/booking/retireddata retained. Archive/Restore preserve existing
Service visibility capabilities and drafts. No Apartment lifecycle follow-up.

Migration0027 explicitly approved by user and applied ONLY verified synthetic
propertylocalesqa DB+role (two empty additive tables, no eager backfill). Existing
hashes unchanged. Integratedtypecheck0/lint0(7oldwarnings)/90puregroups0; affected
11state+9modelcases0; backend10DBgroups0/e780cleaned; finalbuild0/120pages.
Independent4boundedbrowsergroups passed + targeted corrections;0pageerrors and
protected old business hashes unchanged. Media-discard and unpublished hreflang
bugs corrected/confirmed; final cleared-label legacy correction source-approved.
No aesthetic loop or remote writes. e781/newUUID demo +4new own assets retained.

Localmainffb1b75d7→c4cd07f after QA/build, final documentation via gitlog-1.
Sole actual-main dev3071 **PID44149/parent44143/session88324**, cwd verifiedmain;
main-open read-only200 Service/New/Category:4tabs,4names,sharedID,SEO,0errors.
Safe synthetic DB5658/proxy4558, storage9077 restored existingfiles **PID30456 /
session39214**; keep them running. Logs/evidence `/private/tmp/central-hill-service-locales-qa/`.
Old checkpoint84793/84787 and oldstorage had disappeared before runtime swap;
root stopped only own compiled candidates. Preserve worktrees, allfiles/artifacts,
original untracked logo + publicmedia symlink and ignored safeenvs. No push/deploy.
No pending authorized task; ContactremoteDB, Guides/Translations removal and other
Apartment/Service follow-ups stay deferred until explicitly requested.


## Checkpoint before clear — Services next (2026-11-06)

User now asks to clear, then convert individual Services create/edit while keeping
its FORM and adding EN/ES/PT/FR tabs with the established EN-inherit-until-localized-
edit behavior. Shared images/category/icons; icons/category selected in EN and
used across languages. Service categories get four Label/name inputs like Amenities;
selector/public names follow locale with one shared selected category identity.
Read [current handoff](docs/specs/handoff-service-locale-forms-2026-11-06.md) FIRST.
It supersedes old runtime/next-task notes below and in the historical visual handoff.
No implementation started: this is the requested documentary checkpoint before
clear, no tests/DB writes/migration/push/deploy. Resolve checkpoint via git log -1.
After return, inventory nested Service text/media/icons and write the executable
spec/plan, then follow user's resume instruction; no live-editor conversion.
Preserve existing form modules, explicit locale drafts/publication, SEO (Services
has public detail), booking behavior and legacy data. Contact DB task remains deferred.

Keep actual-main3071 alive: PID84793/parent84787/session56260, verified cwd main,
restart log in amenity-locales-qa/main-restart.log. Current main uses synthetic
propertylocalesqa DB5658/proxy4558/storage9077, NOT remote Neon as old handoffs say.
Preserve logo/publicmedia symlink, all worktrees/artifacts/fixtures and ignored envs.
No automatic Guides/Translations removal or Apartment lifecycle work after clear.

## Latest Amenity manual labels —2026-11-06

User requests Label EN/ES/PT/FR in Amenities and localized names in Building
language tabs with shared selections; follow-up explicitly asks same names in
public web. Executablecdab195 in amenity-locales/integration at
/private/tmp/central-hill-amenity-locales-integration, independently approved3/3
production-browser groups. Read [execution](docs/specs/amenity-label-locales.md),
[QA](docs/specs/amenity-label-locales-qa.md), ADR0064. Existing translation rows and
core write seams reused; one taxonomy Save applies all labels, manual targets
approved, blank target removed for English fallback. Old clients omitting targets
preserve them. Form loads raw authored/pending targets without fallback copies;
selectors/public use approved locale names. No new review UI/migration/kernel API.
Building keeps shared amenity_ids; switching tabs changes checkbox labels only.
Taxonomy rename invalidates public/admin caches without republishing Building or
changing its text/SEO/snapshot/revision. Existing sequential write behavior retained.

Integrated typecheck0/lint0(7oldwarnings)/16puregroups0/build0(114pages, local
CIRCLE_NODE_TOTAL=3 selects2workers without config change); backend3/3DBgroups0,
e770 tests cleaned. Independent browser3/3passes: four inputs/raw pending/manual
Save+fallback; ENselectedsharedacross4tabs/Save/reload and4publicnames; renameEN/
clearES updatespublicwithoutBuildingrepublish, selection/text/SEO intact, mobile.
Protected old data hashes unchanged,0pageerrors. Initial harness composite-key hash
fixed before browser/mutations; no product correction. Only new e771 demo touched.
Report07fca86 approved; local main ff5c66aee→3cea4e8. Sole actual-main dev3071
PID82624/session64768, cwd verified. Read-only main-open check passes e771Amenity/
Building and user d600200: four labels and same selectedID across4localizedtabs,
0pageerrors. Root locator for required EN corrected before final pass; no source
changes/contentwrites afterQA. Runtime/evidence in execution. Preserve worktrees,
original logo/publicmedia symlink/safeenv. No schema/remoteDB/push/deployment.
No automatic Services/Apartment lifecycle work in this request.

## Latest Apartment booking/SEO correction —2026-11-06

User requests ONE full booking URL per Apartment language, new-tab unit-card link,
and removal of SEO authoring because no public Apartment detail exists. Executable
37a8fe1 in apartment-booking/integration at
/private/tmp/central-hill-apartment-booking-integration, independently approved in
3bounded production-browser groups. Read [execution](docs/specs/apartment-booking-link.md)
and [QA](docs/specs/apartment-booking-qa.md), ADR0063. Optional localized booking_link
extends existing v1 JSON; no migration. Absent field retains legacy override/base;
real edit writes selected-language link; explicit null clears unit URL without old
base revival, retaining existing in-page #book fallback. UnitCard already supplies
_blank/noopener noreferrer for configured URLs. Hidden legacy/SEO/OG values retained
internally; no SEO/technical booking controls. Admin EN-list indicator shares resolver.
Language ownership/inheritance/explicit Publish and common physical/photo data intact.

Integrated typecheck0/lint0(7existingwarnings)/13puregroups0. Identical backend
passed8DBgroups(4new+4regression), e760/e420/e520 cleaned. Initial7worker build
interrupted130 after resource-related prerender timeouts; final pnpm build0/110pages
with local CIRCLE_NODE_TOTAL=3 selecting2workers. No tracked config change.
Independent production3071 QA3/3passed: legacy/no-write/noSEO, ENdraft/reload/Publish,
PTcustom persists after EN, mobile/clear/newtab attrs/metadata and old fixtures intact;
0pageerrors. Only new e761 synthetic Building+Apartment browser fixtures touched.
Report797b5ef approved; local main ff55ff629→291c90a. Actual-main dev3071 now
PID58039/session64126, cwd verified. Read-only main-open check passes both e761
and user-provided d400/d500 editor200: oneURL, noSEO, ENclear/PTpreserved,0errors.
Evidence/runtime in execution. Preserve all worktrees/safeenv,
original logo/publicmedia symlink. No schema/remote DB/GitHub/push/deployment.
No automatic Apartment archive/restore or Services follow-up in this request.

## Latest Building booking correction —2026-11-06

User requests only Label and Link per Building language. Implemented on
building-booking/integration at /private/tmp/central-hill-building-booking-integration,
executable fdb462f; independently QA-approved report573c4a4. Read
[execution](docs/specs/building-booking-button.md) and
[QA](docs/specs/building-booking-qa.md); ADR0062 owns optional localized
booking_button in existing v1 JSON. No migration. Both public Building CTAs consume
authored Label/Link; explicit empty Link hides both, without legacy/global revival.
Old snapshots retain legacy URLs/labels until actual edit. GET/unrelated Save do
not materialize it. Listing-card external navigation stays a shared general flag.
Locale inheritance/ownership, explicit Publish, SEO and common media stay intact.

Integrated typecheck0/lint0(7existingwarnings)/15puregroups0/build0(106pages).
Identical writer backend passed11DBgroups(3new), e750/e410 fixtures cleaned.
Independent production3071 browser run passed5bounded functional cases: legacy
no-write/SEO Save; Label-only/EN Publish; PT Save/reload/Publish; later EN preserves
custom PT and other publications; mobile/clear/fallback suppression/listing.
Protected pre-existing data unchanged,0pageerrors. e751 synthetic Building+Apartment
demo retained. Only authorized propertylocalesqa used; no schema/remoteDB/push/deploy.
Delivered via local main ff to12ee8e5; one actual-main dev3071 PID35045/session3504,
cwd verified. Read-only final check200: two Booking fields, ENcleared/PTpreserved,
0pageerrors. Evidence main-open.json under QA artifacts; final runtime in execution.
No repeated functional matrix or aesthetic QA loop.

Previous tab/gallery refinements captured in checkpoint e029605, not uncommitted.
Preserve worktrees, safeenv, original logo and publicmedia symlink. No automatic
Apartment lifecycle/Services work authorized by this task.

## Latest visual follow-up — compact Building gallery

User requests a simpler Gallery in Building editor: adjacent thumbnails (4columns)
and one Add image button. Building locale editor now uses a responsive2/4-column
list with compact image cards, Replace/Remove, position and reorder controls, plus
one standalone Add image picker (no empty No image tile). Shared MediaField adds
optional gallery presentation/addLabel; default appearance/queue handlers unchanged.
Same local previews/normalization/deferred Save pipeline; no persistence/API/schema
changes. Existing pending language-tab edits and review doc preserved. New Add image
label in4locales. Main dev3071PID5677 stays live; aestheticL0 no tests/automaticQA/
DBwrites, user reviews. Changes uncommitted. Preserve staged user uploads/client
work, original logo, syntheticmedia symlink and safeenv.

## Latest review / Home EN local fixture —2026-11-06

User asks to REVIEW create/edit Building+Apartment coverage against public web and
reports/en404. Read docs/specs/property-public-coverage-review.md for detailed map,
limits and findings. Review only: no new form implementation or visualQA/tests;
three pendingtabstyle edits preserved. Read-only browser confirms4forms200/same
create-edit fields, listing/detail200, dynamicFAQ/gallerypresent,0pageerrors.
Findings: main public entitydata covered; section/CTA/globalcopy not perentity;
ALTnoteditablehere; ApartmentSEOstoredwithoutpublicApartmentroute; Apartmentarchive
stillreadonly/noRestore (BuildingfixdidnotincludeApartment). Do not silently mark
those pending items implemented or start them without the next user instruction.

/en404 cause: syntheticDB had NOHomecontent/publication. User explicitly authorized
newHomeENexample. Createdonly Home rows (ENdraftrev1, other3null), then PublishEN
fromactualPageseditor. ENnowpublishedrev2/nodraft, ES/PT/FRunpublishedrev0; /en200,
h1Central Hill—local preview,0pageerrors. No existingdataoverwrite/schema/remoteDB.
Safe main dev3071PID5677/session63080 unchanged, no restart. Artifacts/script/payload
/private/tmp/central-hill-property-coverage-review; seed guardedDBrole+no existingHome.
Othermissingmarketingpages weren't seeded. Preservelogo/publicsymlink and pendingUI.

## Latest visual follow-up — unified language tabs

User requests Pages' exact language-tab design for Buildings, Apartments and Blog
Post (EN + localized English source label, ES/PT/FR; same container/button sizes,
weights and accent selection). Three locale-editor UI files modified on main after
954f7da, uncommitted for user review. Uses existing backoffice.pageEditor.source
translations. No behavior/persistence/Pages changes, no tests or automated QA/DB
writes (aesthetic L0). Main dev3071PID5677/session63080 stays running; no restart.
Preserve these pending edits, original logo and syntheticpublic symlink.

## Building status/form correction delivered —2026-11-06

User reported terminal archive lock/inaccessible status actions/inconsistent form.
Delivered52cf4bd→2d99dba by localmainff, executable5077515. Read
[spec](docs/specs/building-status-form-correction.md) and
[QA](docs/specs/building-status-form-qa.md). Archive is reversible visibility;
archivedBuilding editable; Save keeps archive, Restore oldpubs without consuming
drafts, Publish selected locale reactivates. Archive/Restore prominent in toolbar;
one-column uniform-width form/44pxcontrols/128pxtextareas, no duplicate inner h1.
Typecheck/lint/build0;27focusedtests0; independentfunctionalQA5groups approved.
No aesthetic QA/screenshots/geometry: user validates appearance onlocalhost.
Actualmain3071dev **PID5677/session63080**, safe propertylocalesqa DB5658/proxy4558,
storage9077/public symlink retained. Rootread-onlyGET confirmsHTTP200, Saveenabled,
Archive/Restore present,0pageerrors (main-open.json). Preserve this new singleapp;
old90520andcandidate2550stopped. No schema/migration, no remote/push/deploy.
Only newown e640tests(cleaned) ande740browserfixture used; d/f/user QA69a/465
unchanged. Original logo/media symlink stayuntracked. No task next automatically;
follow user visual review. Latest correction supersedes old archivedreadonly rule
and historical Blog-only merge boundary below.

## Blog-only main integration completed —2026-11-06

Usuario autoriza merge local y confirma: **sólo Blog y topbar**, mantener nuevo
editor Buildings/Apartments fuera de main hasta revisión propia. Preparación en
/private/tmp/central-hill-blog-main-integration, rama blog-main/integration,
baseBlogaf3a4a1 sobre main48ae09c; deltaBlog/topbar validado29db0c5 seleccionado
sin historia/codeProps. Ver docs/specs/blog-main-integration.md. Blog entero igual
al candidato revisado; workspace conserva reglas legacy de Properties. Sólo
migraciónBlog0024, no0025 ni namespacepropertyEditor/guardasProperty nuevas.
Ensamblaje2aabcc4 verificado: typecheck/lint/build0,26tests+10icon0,db:check0,
lecturas browser3076 sin errores ni content writes. Fast-forward local autorizado;
main actualizado48ae09c→554dd27 por fast-forward. Dependencias instaladas offline
según lockfile, exit0. Cierre documental posterior se resuelve con git log -1.
Sin DBremota/migraciones,
main env remoto no se usa para pruebas. Original logo sin rastrear se preserva.
Edificios/Departamentos QA aprobado pero pendiente revisión usuario en3073,
property-locales/integration, /private/tmp/central-hill-property-locales-integration.
ÚltimoBlog revisado3075 permanece intacto;3076 temporal de validación detenido. No nueva QA pendiente de este merge. Services aún no implementado, spec/plan
propuestos en blog-form/integration deben alinearse a formularios antes de comenzar.


## Property forms delivered on local main — 2026-11-06

Latest visual follow-up: user asks for one catalogue back control in Buildings:
style the top workspace link like the lower button, remove the lower duplicate
for existing Buildings, keep New's only back button. Two Buildings UI files modified
locally; no tests/automatic QA/DB writes (L0, user reviews). 3071 now runs main in
**dev**, PID90520/session55366, safe synthetic env unchanged; production90276 stopped.
Keep this single app listener and original logo/synthetic public symlink. No new commit.


User now authorizes applying0026, stopping old Central Hill app previews and running
one local main server to test forms. Main base0e72983; prepare on
property-forms/main-integration in/private/tmp/central-hill-property-forms-main-integration.
Source property-forms/integration d896720, executable8cbd0e0/sourceQA8c6521b.
Migration0026 applied only to synthetic propertylocalesqa (db/role verified),
new e* fixtures only. See docs/specs/property-form-editors-execution.md/delivery.md.
Tabs/form ownership: EN fills untouched languages until their first own text/SEO/
booking edit; per-language Publish explicit. Common photos/physical data live onSave.
User latest request supersedes preserving old app listeners3071/3072/3073/3075:
they are stopped; worktrees/data retained. Final app3071 from actual main with safe
synthetic env; remote Neon must not be used. DB/proxy and storage remain necessary.
No push/deploy/remote DB writes. Preserve untracked original logo and env backup.
Executablefed9fb8:104tests/typecheck/lint/dbcheck/fullbuild pass; independent
functional browser QA approved10groups with3uploads and unchanged oldfixturehashes.
Mainff0e72983→f4f98dc complete after QA; same approved buildfed9fb8. Actual
main app3071 PID90276/session14090, synthetic propertylocalesqa (NOT remote Neon).
Root5GET runtime checks pass, no further matrix; preserve this new3071 process.
Read docs/specs/property-forms-main-integration.md for full delivery/environment.
Original ignored env backup.env.before-property-forms-20261106.local and old.next
archive preserved; public/propertylocalesqa synthetic symlink intentionally
untracked beside original logo. No pending implementation; follow user review,
do not start Services/Guides automatically.

## Latest local Backoffice work — 2026-11-05

Before continuing after a context clear, read [session handoff](docs/specs/handoff-visual-refinements-2026-10-31.md).
Current user requests: local commit before clear; no push/deploy. Aesthetic changes
are L0, user validates in localhost, no automatic tests/QA. Contact DB update via
Neon MCP was explicitly deferred; do not resume it without a new request.

Latest arc after509d785: all Pages selectors consolidated by section; localized
Home/Guest/Services booking buttons, live-preview validation/focus/counter fixes
and Guest contact fields/dialog preview completed. Blog listing now has3sections;
its shared article CTA is edited at `/admin/pages/blog/article-sidebar` in a
localized example article using the actual public article renderer. Both Blog
editors share the complete existing per-locale draft/publication unit and unsaved
navigation guard. Read [Blog editor delivery](docs/specs/blog-article-sidebar-editor.md)
and the session handoff for exact checks and earlier changes. Functional checks
used DB-free fixtures; no real3071save/publish/upload/DB write. Latest13focused
tests/typecheck/lint/compile and4locale desktop/mobile browser cases pass; no new
independent QA claim. User now requests clear: local checkpoint commit, no push/
deploy; resolve its hash with `git log -1`. Preserve3071PID7039 and untracked logo.
No pending authorized work after checkpoint; follow the next user request.

Earlier arc afterc9484b6: Pages order and sidebar grouping updated; visual Pages
editors start with sidebar hidden, toggle it via topbar icon, use a500px inspector
on the left and sticky language/Save draft/Publish header. Page navigator switches
directly between editors, with English Cancel/Continue warning for unsaved work
across started locales; saved drafts can be left unpublished. Read
[sidebar](docs/specs/backoffice-sidebar-organization.md),
[workspace](docs/specs/backoffice-editor-workspace.md) and
[page navigation](docs/specs/page-editor-page-navigation.md).
User reviews localhost3071; no automatic tests/QA/check suites or DB writes in
this arc. Local login403 fixed only in ignored.env.local by matching
BETTER_AUTH_URL to localhost3071; it still points to remote Neon, not an isolated
test DB. User requests local checkpoint commit before clear; resolve it with
git log -1. No push/deploy. Preserve unused untracked base-logo PNG and running
localhost; no pending authorized task after commit, next work follows the user.

Earlier About photo cards and their validation remain documented in
[About photo cards](docs/specs/about-contact-photo-cards.md) and the session handoff.

## Remaining Pages adapters — local delivery approved

User authorized implementation from documentary85676c3 and automatic scoped local QA.
Integration `/private/tmp/central-hill-page-editors-editorial-integration`, branch
`page-editors-editorial/integration`. Follow spec/plan/handoff under
`docs/specs/page-editor-editorial-pages-*`. Two waves Services/About then Guides/Blog
implemented in disjoint worktrees; root integrated, independent scoped QA approved
code48cc3c2. Read [delivery](docs/specs/page-editor-editorial-pages-delivery.md) and
[QA](docs/specs/page-editor-editorial-pages-qa.md). Typecheck/lint/build pass;59cases
verified (58initial +1Buildings fixture correction),10new exactly. No product migration.
New synthetic pageeditors2qa DB5638/proxy4538/storage9069, preview3069PID8680/session73545; SQL db/role
both verified pageeditors2qa. Preserve validated3068 and all earlier artifacts.
3068 re-opened unchanged original build/env/DB after final check found no listener,
PID9272/session34102, login200. No new product migration, no main/push/deploy/GitHub/production.

## Common Pages editor platform — local delivery approved

User authorized implementation from8223f4a after fresh context. Integration
/private/tmp/central-hill-page-editors-integration, branch page-editors/integration.
Executable7e13d9f independently scoped-QA-approved, implements common engine/UI and adapters Home, Owners,
Buildings LISTING, Real Estate and Guest; no Forms selection/capture/email changes.
Read [delivery](docs/specs/page-editor-platform-delivery.md),
[spec](docs/specs/page-editor-platform-spec.md) and
[execution](docs/specs/page-editor-platform-plan.md). Typecheck/lint/26focused tests/build
passed, with scoped corrections/rechecks documented; independent browser QA approved.
New synthetic pageeditorsqa DB5628/proxy4528/storage9068, preview3068 PID73105/session55343.
No new product migration, main/push/deploy/GitHub/production. Original checkouts/DB/artifacts
preserved;3065/3067 were not listening on latest read-only check, no old process touched.
Automatic scoped local QA/tests authorized; no repeated functional confirmation questions.
Two implementation writers completed in separate worktrees; independent QA approved after
the single grouped pass and one targeted confirmation of the corrected false-dirty indicator.
See [QA](docs/specs/page-editor-platform-qa.md). Worktrees/fixtures retained for local review.

## Home ephemeral live preview follow-up

Current executable8da3519, independently QA-approved (report f8d7c91), on page-drafts/integration. Read
[execution](docs/specs/home-live-preview-execution.md) and
[QA](docs/specs/home-live-preview-qa.md). The user's later request replaces the saved-only
preview rule for Home. Current form changes render privately after300ms idle through the
same Home renderer. Refresh resends local state without reload. No autosave, upload flush,
content DB writes, public invalidation or publish from preview. Local images use same-origin
blob metadata until Save draft flushes them; persisted normalized media takes precedence.
Save draft/Publish and locale revisions remain explicit and independent.
Production local preview3067 PID25042/session29066, same synthetic pagedraftsqa environment.
Global typecheck/lint/7focused cases/build pass; final independent QA evidence linked above.
No kernel/migration/package changes, no main/push/deploy/production. Preserve3065/others.

## Home draft/publish per language — local implementation

Implemented from e06272b on page-drafts/integration in
/private/tmp/central-hill-page-drafts-integration. Code b4bb282, independently QA-approved; report fd7892c.
Follow-up63a628a fixes typing focus loss in shared shell; root verified continuous
EN/ES single/multiple fields/mobile, preview selection, typecheck/lint/3bridge tests/build.
This follow-up has focused root verification, not a new independent QA claim.
Previous focus verification used3067 PID5230/session43430 (superseded by live preview above).
Read [delivery](docs/specs/page-locale-drafts-delivery.md),
[handoff](docs/specs/page-locale-drafts-handoff.md),
[spec](docs/specs/page-locale-drafts-spec.md),
[execution](docs/specs/page-locale-drafts-plan.md),
[QA](docs/specs/page-locale-drafts-qa.md) and ADR0040.
Exactly Save draft and Publish, both for selected locale. One JSON draft per language;
private preview opens it if present, otherwise that language's published JSON, then
renders ephemeral local changes per the later live-preview request. Publish EN
clears only EN draft; ES draft/public/local work stay intact. No translation approve/review.
Persistent per-locale revision survives draft deletion. Home first; Owners not implemented.
Nine focused tests, typecheck/lint/build/db:check passed; one EN/ES desktop/mobile
functional browser sequence passed, final independent report records evidence/limits.
Preview3067 uses new synthetic pagedraftsqa DB5618/proxy4518/storage9067. Migration0023
applied only to this isolated QA DB; Home3065 and its original checkout e06272b preserved.
User explicitly reiterated automatic local QA/test/DB authorization; no repeated functional
approval questions. Sandbox still applies. Neon production/GitHub need separate approval;
no main/push/deployment in local delivery. Preserve all worktrees/environment artifacts.

Owners plan/handoff can now consume this base after reading the completed QA report. Future page-adapter parallelism is described in
[parallel plan](docs/specs/page-editors-parallel-plan.md): proposed one agent/page, maximum3
writers with current4slots including root. No agents launched. Exclude Services CMS,
Buildings CMS and Blog posts. Shared infrastructure/contracts must land before page agents.
Preserve Home3065 and all existing environment artifacts.

## Home contextual editor pilot (2026-10-18)

User authorized implementation from c28615f. Local task branch
home-contextual/integration at /private/tmp/central-hill-home-contextual-integration;
corrected executable6359b6d, independently scoped-QA-approved. User accepted Home.
SEO toolbar follow-up3c55a1b has focused root verification; see delivery.
Read [execution](docs/specs/home-contextual-editor-execution.md),
[delivery](docs/specs/home-contextual-editor-delivery.md) and
[QA](docs/specs/home-contextual-editor-qa.md). Closed scope remains in
[plan](docs/specs/home-contextual-editor-plan.md). Home only; shared shell and adapter,
EN/ES/PT/FR, SEO/ISR, saved-content private preview. No Forms selector/slot or Avantio
editing. Stable identities cover figures, benefits and assurances. ADR0039 owns the
minimal optional Hero preview annotation seam; public callers omit it.
Preview3065 uses new synthetic homecontextualqa DB5608/proxy4508/storage9065;
Forms3064 and concept3070 preserved. No main integration, push, deployment, GitHub
or Neon production writes. User explicitly reiterated automatic local QA; no repeated
functional approval questions. Safe sandbox operations confined to this project are also
explicitly authorized by the user. Neon production and GitHub changes require separate
authorization. Environment sandbox restrictions still apply.

## Active form-builder arc (2026-10-18)

User authorized the real reusable form builder first. Read [execution/spec](docs/specs/form-builder/00-execution.md) and [ADR0038](docs/decisions/0038-form-builder-and-resend.md). Provider explicitly confirmed **Resend**, not SendGrid. Integration branch `form-builder/integration`, checkout `/private/tmp/central-hill-form-builder-integration`, base377cffd; contracts b0fee3d. Two implementers in separate worktrees completed; independent normal scoped QA approved executable `e33f078` (report `b7d8d4c`). Read [QA](docs/specs/form-builder/01-qa.md) and [handoff](docs/specs/form-builder/02-handoff.md). No public form placement/selection or page-editor conversion in this arc; current public forms and Avantio stay intact. Preserve previews3059–3063 and static concept3070. New isolated formbuilderqa DB/proxy5598/4498, preview3064; final email mode console (no real sends), Resend prepared and QA-tested through a fake transport. Typecheck/lint/28tests/build/db:check passed. Local QA authorized automatically. No main integration, push, deployment, GitHub or Neon production writes.

## Contextual editor concept (2026-10-18)

Current branch `contextual-editor/concept`, checkout
`/private/tmp/central-hill-contextual-editor-concept`, baseline b4c97e4.
Read [spec](docs/specs/contextual-editor/00-spec.md),
[plan/effort](docs/specs/contextual-editor/01-plan.md),
[reusable forms](docs/specs/contextual-editor/02-formularios.md) and
[concept QA](docs/specs/contextual-editor/03-review.md).
User authorized only spec/plan and a standalone HTML/CSS interaction study,
with agents, before polishing/reviewing and later authorizing the React feature.
Prototype: `mock/contextual-editor/`, static local3070, no CMS/DB persistence.
No changes to src, packages, databases or previews3059–3063. Typography polish
and user design feedback remain; concept is not production feature approval.
Home keeps Avantio; reusable Lead forms are a separate future catalog feature.
No main integration, push, deployment, GitHub changes or Neon production writes.

## Current Blog page handoff (2026-10-18)

Read [Blog CMS audit](docs/specs/blog-cms-audit.md) and
[proposed plan/spec](docs/specs/blog-cms-plan.md). Implemented and independently functional-QA-approved on d7fc540 (executable
integration cb1f068; later docs/comment/test alignment only). Read
[execution](docs/specs/blog-page-execution.md), [QA](docs/specs/blog-page-qa.md)
and [handoff](docs/specs/handoff-blog-page.md). New isolated preview3063 uses
blogpageqa DB/storage; no migration. Baseline documentation1c48555/code d4e13c9.
Implementation focuses Pages→Blog on listing header, Featured/Journal
headings, newsletter copy, listing SEO and EN/PT/ES/FR translation wiring, per
the user's four screenshots. Article-editor/search improvements are follow-ups.
Preserve previews3059–3063; delivery stays in blog-page/integration,
/private/tmp/central-hill-blog-page-integration. No main integration, push or deployment.
Verification is normal functional save/reload/public/media/translation checks,
without an expanded adversarial matrix. Local QA is authorized to run automatically;
request access only for GitHub changes or Neon production. Prior handoffs below remain preserved.

Read [CLAUDE.md](CLAUDE.md) for architecture and [docs/multi-agent-workflow.md](docs/multi-agent-workflow.md) for the authoritative execution procedure. Read the active spec in `docs/specs/`, the assigned slice README and relevant ADRs before editing.

## Current handoff

Individual service conditional editor implemented and independently QA-approved on code
`9faffe9`; local delivery recorded in
[Service detail handoff](docs/specs/handoff-service-detail-editor.md).
See the [execution spec](docs/specs/service-detail-editor-execution.md) and
[QA evidence](docs/specs/service-detail-editor-qa.md). Savepoint before implementation:
`a1107f8`, local tag `savepoint/pre-service-detail-editor-2026-10-18`.
Migrations0019/0020 were applied only to isolated local QA databases; no push/deployment.

Previous Services listing editor delivery remains in
[Services handoff 2026-10-18](docs/specs/handoff-services-2026-10-18.md).
Guides listing page editor implemented and independently QA-approved on `fc1daac`.
Local delivery: [Guides handoff](docs/specs/handoff-guides-page-editor.md),
[spec](docs/specs/guides-page-editor.md), [QA](docs/specs/guides-page-editor-qa.md).
Savepoint: `00c836a`, tag `savepoint/pre-guides-page-editor-2026-10-18`.
No migrations, push or deployment. Preview3060 uses isolated synthetic guidespageqa;
previous user preview3059 is preserved. Sidebar work is captured in00c836a.
Individual Guides CMS implementation was subsequently authorized and is integrated
on task branch `guides-cms/integration` in `/private/tmp/central-hill-guides-cms-integration`.
Code `1a2739c` is independently QA-approved; delivery remains on the task branch.
Read [Guides CMS execution](docs/specs/guides-cms-execution.md),
[QA evidence](docs/specs/guides-cms-qa.md) and [handoff](docs/specs/handoff-guides-cms.md).
Savepoint `6a3c1ce`, tag `savepoint/pre-guides-cms-implementation-2026-10-18`.
Migration0021 and synthetic writes are isolated to guidescmsqa/freshqa; preview3061.
No main integration, push, deployment or production writes in this task delivery.
The city-filter collapse follow-up was user-validated; typecheck/lint/build passed,
with no new independent browser QA claim. Preserve both local preview environments.

About CMS follow-up is implemented and independently functional-QA-approved on code
`d4e13c9`, task branch `about-cms/integration` in
`/private/tmp/central-hill-about-cms-integration`. Read
[About handoff](docs/specs/handoff-about-cms.md),
[execution](docs/specs/about-cms-execution.md) and
[functional QA](docs/specs/about-cms-qa.md). Savepoint6849427,
tag `savepoint/pre-about-cms-implementation-2026-10-18`. No new migration;
existing0000..0021 only applied to new isolated aboutcmsqa, preview3062.
Final runtime checkout `/private/tmp/central-hill-about-cms-runtime` on d4e13c9.
The user explicitly narrowed QA to normal form save/reload, public output and media
uploads; do not reopen a broad adversarial matrix as an unfinished delivery gate.
No main integration, push, deployment or production writes. Preserve previews
3059/3060/3061/3062 and their environments.

## Working agreement

- User update 2026-10-30: code changes and QA are preauthorized; request authorization for database changes or production actions. Aesthetic changes are L0: do not run tests or automatic QA; the user validates them on localhost. Environment sandbox permissions still apply. This overrides broader verification requirements below for aesthetic-only work.
- For an authorized agentic implementation: one orchestrator, two implementers with disjoint file assignments, then one independent QA agent reviewing the integrated result. Simple tasks remain with the main agent. Do not start implementation when the request is only for a spec or review.
- The orchestrator records the base commit, branch/worktree paths, exact writable files, contracts, acceptance criteria and verification commands in the active spec before delegating. Shared files have one writer. Contracts land before consumers.
- Subagents may share the same checkout by default. Spawning an agent does not create a worktree. Verify each agent's actual working directory and branch. Use a separate worktree/branch for each parallel writer; if the runtime cannot target them, serialize writes and explain the limitation.
- Worktrees separate working files, not permissions, Git metadata, databases or external services. Use explicit command working directories and isolated test data. Never copy production credentials into agents' environments by default.
- Edit only assigned files, including new files. Request scope changes from the orchestrator. Cross-slice imports use `contract.ts` only. Kernel changes require an ADR and orchestrator ownership.
- Preserve the user's and other agents' changes. No blanket staging, destructive cleanup, reset, forced checkout, history rewriting or killing another agent's processes to make checks pass.
- Use Node 22 and pnpm. Run `pnpm typecheck`, `pnpm lint`, real affected tests through `pnpm exec tsx --test <explicit-test-files>`, and `pnpm build` on the integrated result. Run `pnpm db:check` for migration changes or when the spec requires it. Record actual commands, exit codes and tested commit.
- `pnpm test` and `pnpm boundary:check` currently succeed without checking anything. Do not count them as verification; review boundaries explicitly. Report failed or blocked checks honestly.
- Public changes preserve EN/PT/ES/FR, SEO and ISR revalidation. UI/editor work requires browser checks and actual save/reload tests on an isolated DB when persistence is affected. A localhost URL does not imply an isolated DB.
- QA reports reproducible findings against the integrated candidate. Implementers fix within their scope; QA retests affected behavior. No merge to `main` with unresolved blocking failures or required checks missing.
- For the Services task, local commits and integration into local `main` after QA are authorized by the user's requested workflow. Do not ask again for each routine local step. Push, deployment and production writes require separate authorization. For other tasks, follow the user's stated delivery boundary.
- Keep the active spec current with progress, decisions, verification and remaining work. Handoffs include commit, changed files (including untracked files), checks and limitations. Only the orchestrator integrates; preserve worktrees until their work is safely captured.

## Instruction maintenance

Current user instructions govern the task. These agreements and the canonical workflow supersede conflicting procedural instructions in historical specs, mock guides and component-extraction notes. Historical documents remain useful implementation references; they do not grant extra permissions. Do not claim automatic sandbox or CI enforcement unless it is actually configured and verified.
