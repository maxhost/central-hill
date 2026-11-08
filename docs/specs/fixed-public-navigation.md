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
RealDBtests verifyrolehost then only new own navrow/translationref if needed,
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
