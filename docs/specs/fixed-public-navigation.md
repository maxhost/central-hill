# Fixed public navigation — executable plan

Base main37a553f, trackedclean; originallogo/publicmedia symlink untracked preserved.
2026-11-07 user asks Owners/About submenus translated4langs, fixes navigation
label/order/URL in code, retires Navigation and nav_item generictranslation. Global
Translations removal is a readiness question: remain Settings stats/hours, ALT,
city.intro policy and legacy closeout; leave global route/sidebar active. Current
actualmain3071 PID68928/parent68922/session43161, safe propertylocalesqaDB5658/
proxy4558/storage9077. Read-only DBhost+db/role verified: nav_item0, Settings0;
legacy city.intro/FAQ/service/taxonomy rows exist. No schema/migration needed.

ADR0074. Root commits fixed-navigation.ts canonical trees (same current top menu,
Owners10/About8/RealEstate10/Guests2 sublinks, footer2groups×5links),4messages and
predicate export before writers. getNav(locale,location) returns fixed localized
NavLink[] regardless of DB, no fallback DBmerge, stable IDs; cachekeyfixed-v1.
Header/mobile share tree, Footer same fixedgroupdata; no visualstyle/CTA/widgets/
contact/SEO/Pages changes. Retire Navigation sidebar + gated oldroute redirect to
Settings; saveNavigation authenticated denial, no hidden writepath. Generic nav_item
inbox/review/actions/bulk/generation blocked, oldreview redirectsSettings. Preserve
all DBrows, table/kernel remain; global Translations for remaining work stays.

## Owners / paths

Integration /private/tmp/central-hill-fixed-navigation-integration branch
fixed-navigation/integration. Root owns prepared fixed-navigation.ts/contract,
messages4, ADR/index/thisspec; later Settings/TranslationREADME/data-model/roadmap/
AGENTS and new settings/tests/fixed-navigation.test.ts. No UI redesign; Impeccable
context already ran conversation, incumbentstyle authoritative. Read craft-floor
before UI edit, no aesthetics/screenshots/geometry/polishloops.

Backend /private/tmp/central-hill-fixed-navigation-backend branch fixed-navigation/backend
owns ONLY settings/server/queries.ts, NEW server/fixed-navigation.ts,
admin/actions.ts, admin/queries.ts, Translation admin/actions.ts/admin/queries.ts/
server/generate.ts/admin/ui/review.tsx, NEW settings/tests/fixed-navigation.integration.test.ts.
Helper getFixedNav(locale,location):NavLink[] imports messages4 server-only and pure
canonicaldefs. Existing public getNav wrapper fixed-v1/noDB; keep publicsignature.
Old getNavigationForEdit should not return editable DBvalues (can return empty
shape or fixedEN view); no callers afterroute retires. Remove unreachable navwrite
helpers/imports; saveNavigation acceptsunknown, requireStaffadmin then returns
validation rejection/no writes. isFixedNavigationEntity export guards ALL direct
individual/bulk/generation + raw generator + inbox + entityquery; reviewredirect
Settings beforeloadmatrix. UI/screen/route files owned otherwriter, don't edit.
Boundary CCR approved by root: backend additionally owns NEW
translation/tests/fixed-navigation-guards.test.ts, so generic guards/query/other
copy tests import their own slice internals and Settings DBtests use own internals
or publiccontracts only. No productioncontract expansion. Root executes both
files serial. RealDBtests verifyrolehost then only new own navrow/translationref if needed,
legacy Save rejected+rows exact; getNav ignores own DB content; other Settings
policies stillpass. Clean ONLYown rows/translationseams; never delete old rows.

UI /private/tmp/central-hill-fixed-navigation-ui branch fixed-navigation/ui owns
ONLY settings/ui/site-header.tsx, ui/site-footer.tsx, admin/screens.ts,
app/(admin)/admin/(panel)/navigation/page.tsx. Header use returned full getNav tree,
remove hardcodedOwners/About/fallback/merge duplications (canonicalrootdefsreplace).
Footer use fixed getNav groups, remove fallbackduplication. Preserve allclasses/
layout/contact/Book/Earn/linklocalization/drawerbehavior. RemoveNavigation screen
only, keepSettings. OldNavigation requireStaffadmin then redirectSettings, no form
render. No othertranslation/sidebar/routes/core/message files. ScopedTS/lint;
backendhelperpending means header still compiles withcurrentgetNav API.

IndependentQA after integration owns ONLY fixed-public-navigation-qa.md + own
artifacts. Three bounded readonlybrowsergroups:4locale headerOwners/About actual
submenu labels/hrefs/order, desktopkeyboard/hover +mobileaccordions; footer4labels/
linkorder and Book/Earn/contacts intact; Admin noNavigation, oldroute+navreview
redirectSettings/auth, globalTranslations stillavailable. No contentSave needed in
browser; backend syntheticfixturetests alreadyprove writeguard/noDBnavoverride.
No screenshots/aestheticmatrix/externalclicks or Page/media writes. Verify all42
protectedbusinesshashes exact before/afterbrowser. No remote/schema writes.

## Verification/runtime/delivery

Safeenv /private/tmp/central-hill-building-status-qa/env.sh Node22. Rootbaseline42
capture before DBtests, host propertylocalesqa.local AND SQLdb/role propertylocalesqa.
RootTS/lint + purefixednav/messages/anchors, existingRealEstate6tests, meaningful
DBguardtests and Settings/Website/CTA/Translationregressions serialsingletonfiles.
Use prior externaltestloader; build CIRCLE_NODE_TOTAL=3 (2workers) afterDBcleanup.
Independentproduction3071 QA3groups; root controls main→candidate→actualmain, one
listener and finalreadonlymainopening. Localmain integration onlyafterQA; no push/
deploy. Preserveallworktrees/files/envs/cache/artifacts/logo/publicmedia symlink.

## Progress

Contractsfa83d58 +04089be footer tupletypes beforewriters. UI4fb65bf integrated
55053e9 (4files only), UItypecheck0/scopedlint0. Root935c439 docs/purecontracttests,
13puregroups0 (7newfixedmenus/messages +6existingRealEstate). Backendimplementing
with approved onefiletest-boundary CCR above. Rootbaseline42 captured before any
backendwrites, Settings0/nav0. Main68928 remains until candidatebuildready.

Backend15a0afb integratedfa6b0f6; final6DBgroups0 after boundary split, TS/scopedlint0.
Root candidatefa6b0f6 typecheck0/lint0(7oldwarnings)/88tests0; oldSettings/Owners/
Website/CTA/manualfield Translation regressions plus13menupure and6newDBgroups.
Only newown legacyNavrow and randomtranslationrefs used, cleanupconfirmed; root
independently compared42hashes exact after fullsuite, Settings0/nav0. No product
corrections after integration. Build2workers underway, main68928stillsole3071.

Actual integrated tests (safeenv Node22 + NODE_OPTIONS require existing
/private/tmp/central-hill-property-forms-qa/node-runtime.cjs):
```sh
pnpm exec tsx --import /private/tmp/central-hill-geography-name-locales-qa/backend/test-runtime.mjs --test --test-concurrency=1 src/slices/settings/tests/settings.test.ts src/slices/settings/tests/settings-admin.test.ts src/slices/settings/tests/owners-phone.test.ts src/slices/settings/tests/owners-phone.integration.test.ts src/slices/settings/tests/website-locales.test.ts src/slices/settings/tests/website-locales.integration.test.ts src/slices/settings/tests/navigation-ctas.test.ts src/slices/settings/tests/navigation-ctas.integration.test.ts src/slices/settings/tests/fixed-navigation.test.ts src/slices/settings/tests/subnav.test.ts src/slices/settings/tests/fixed-navigation.integration.test.ts src/slices/translation/tests/fixed-navigation-guards.test.ts src/slices/translation/tests/settings-website-guards.test.ts src/slices/translation/tests/translation.test.ts src/slices/translation/tests/testimonial-quote-guards.test.ts
```
Logs/exitfiles under /private/tmp/central-hill-fixed-navigation-qa. No migration/dbcheck
needed. Independent QA read-only preflight DBhost/role+42hashes passes aftercleanup,
awaits productionREADY. No broaderPage/aesthetic testmatrix.

Build0/144routes/2workers on unchangedfa6b0f6. Main68928/68922 stopped after
build/cwdverification; soleproductionQA3071 PID72352/parent72346/session24919,
integrationcwd/login200 verified. Independent read-only browser3groups underway,
rootno DBwrites. Legacy data remains unchanged and no Settings/Page/media fixture
is needed for this browser pass.

## QA finding / root-owned correction

All readonly browser cases passed onfa6b0f6 except confirmed P2 keyboard transfer,
pre-existing vs37a553f (CSS/NavBar unchanged). Focusout fromtoplink tofirstsubmenu
kept parentfocus-within but transiently nofocus-visible; globalhide rule hidtarget
beforefocusin, leaving bodyactive. Evidence keyboard-stable.log/focusevents.
Root adds ONLY src/app/globals.css to its write set and ADR0074 scope: split hide
condition into nofocus-within OR actualfocusednon-focus-visible descendant. Keep
instant mouse-leave/clickclose, preserve keyboardtransfer window; no newJS/coreUI.
Existing88tests/TS/lint and allotherQAresults remainvalid for unchangedsource.
Buildagain forCSS/typecompile, then targetedkeyboard8Owner/About locale cases,
representativeRealEstate/Guests andmouseleave/clickfocus. No fulltext/mobile/DBmatrix
rerun, no screenshots/aestheticloop. Root controls candidate restart afterbuild.

Correction4635f0b built in NEW runtimecheckout
/private/tmp/central-hill-fixed-navigation-keyboard-runtime branch
fixed-navigation/keyboard-runtime, same trackedsource as integration4635f0b. This
preserves the live fa6 .next artifact while rebuilding; originalcandidate72352
stays on3071 until correctedbuild ready. Frozenoffline dependencies installed in
newruntime, original oldbuild/worktrees/artifacts kept. Initial offlineinstall
command also ran in main by cwd mistake; it used unchanged frozenlock/offline,
trackedmain unchanged, then root correctly installed/builds newruntime. No content
or env/schema change. Finalbuild logs build-keyboard.log/.exit.

Correctedbuild4635f0b0/144routes/2workers includes finalTS/CSS compile. Old72352/
72346 stopped aftercwdverification. Solecorrectedproduction3071 now PID74078/
parent74072/session27579, cwdkeyboard-runtime/source4635f0b/srcdiff0 verified,
login200. IndependentQA targeted10keyboard/mouse confirmation underway, all
non-keyboard cases retained fromfa6b0f6. No more DBfixtures/writes or fullmatrix.

Independent QA approves corrected4635f0b: all3non-keyboard readonlygroups retained
fromfa6b0f6 plus10/10targeted keyboard/mouse cases (Owners/About4locales and
RealEstate/GuestsEN), Tabfirst+nextchild/ShiftTabback,8mousefocus-no-pin andhover
open/close.0pageerrors, P2resolved, no otherproductfix. Browserread-only throughout,
Settings0/nav0 and42hashesexact; root independently comparedJSON. Finalconfirmation
made no DBreads/contentwrites; no repeatedfullmatrix. QA reportfinalsource4635f0b.
