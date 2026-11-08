# Settings hours labels + cleanup — executable plan

2026-11-07 user requests four editable Hours Labels and audit/removal Headline stats,
Avantio, Buildings listing and potentially duplicate Site icons. Base main7c1a205,
trackedclean; originallogo/publicmedia symlink preserveduntracked. Current actualmain
3071 PID75584/parent75578/session24974, syntheticpropertylocalesqa DB5658/proxy4558/
storage9077. Root role/host verified and protected42 baseline captured Settings0.
No schema/migration. Localmain delivery, no push/deploy/remoteDB writes.

## Audit/decisions

Headline stats unusedpublic: onlydead StatsBand composer; Pages own figures. Avantio
Settings account/JSON unused: active Home widget server/avantio-widget.ts fixed
ACCOUNT=bk_centralhill, independent of Globals. Buildings listing flags unusedpublic
and filters currentlyhidden; not active duplicate page fields. Remove all3cards,
ignore retiredpayloadkeys, preserve DBcolumns/translationrows exactly on update;
new singleton fills existing internalDEFAULT_GLOBALS (including realwidgetaccount).

Site icons ACTIVE: account/contact/language header; Blog search/readingtime/date/TOC/
bullets/callouts; Guide templates/location/tip/TOC; apartment bedrooms/beds/guests/size.
Service7slot globals are defaults for per-Service icons. Keep active controls with
clearer description; remove ONLY services_how_1/2/3 controls (zero publicreaders).
Keep raw retired/unknown icon entries; Save merges activekeys, not normalizationwrite
of defaults over olddata. No deletion of schema/types/legacydeadStatsBand.

ADR0075. Hours Label EN inline canonical, targetJSONmapoffice_hours_translations
{es,pt,fr}:trim/max120 strings, optionalfullstrictmap; rawpending targets exposed,
no ENcopy. Blank target deletes only ownlocale; omittedmap no-op. Public approved
valid label else nonblankEN else defaultlanguage label. BlankEN keeps own targets,
no legacyENrow revival/write/delete. Shared office_hours remains exact authored
text, not per-language schedule. Blank schedule only uses localizedweekdayfallback
with unchanged09:30–18:00. officeRows gains optionallocale='en' to retain oldcallers;
About calls explicitlocale. Cachev6, existinglayout/globals invalidation updatesAbout
without PageSave/Publish. Generic company_settings now completely excluded/blocked/
redirectSettings, since remaining activefieldsmanual and statsretired. Preserveallrows,
globalTranslations stays for otherremainingtypes.

## Contracts/owners

Integration /private/tmp/central-hill-settings-cleanup-integration branch
settings-cleanup/integration. Root prepares hours-label-types.ts/constants/type,
EDITABLE_SITE_ICON_KEYS in site-icons.ts, isSettingsEditorialEntity predicate in
manual-locale-fields.ts/contract; optionalDTOoffice_hours_translations; adminvalidation
activekeys +retiredkeys z.unknown().optional() so stalehiddeninvalidJSON/statsdon't
blockSave. Root later owns messages4, Translation admin/{actions,queries}.ts/
server/generate.ts/admin/ui/review.tsx +tests/settings-website-guards.test.ts and
fixed-navigation-guards.test.ts updates (other-copy assertion moves to unretiredFAQ),
Pages ui/about-office.ts/ui/about-page.ts +newtests/office-hours-labels.test.ts,
Settings tests/settings-admin.test.ts +newtests/hours-labels.test.ts, READMEs/
masterplan/data-model/AGENTS/execution/ADR. No other shared/core changes.

Backend /private/tmp/central-hill-settings-cleanup-backend branch settings-cleanup/backend
owns ONLY Settings admin/actions.ts/admin/queries.ts/server/queries.ts,
NEW server/hours-labels.ts and NEW tests/hours-labels.integration.test.ts.
Helpers rawHoursLabelTranslations(rows), resolveHoursLabel(baseEN,locale,rows),
saveHoursLabelTranslations(id,baseEN,targets?,updatedBy?). Admin rawrowreuse, EN
canonicalinline; public defaulthelpers use preparedconstants. Remove setSourceContent
stats/hours writes (preserve legacy EN rows). Update only active columns; retireStats/
Avantio/flags submittedvalues ignored even oldclients; insert defaultlegacycolumns
fromDEFAULT_GLOBALS internally. site_icons validationactivekeys; merge existingraw
site_icons +inputactivekeys, insertdefaults+activekeys. Preserve retired/unknownkeys.
ReadModelstats/avantio/flags can remain for backcompat; no new consumers. v6.
DTO may retain legacyread-only hiddenfields for compatibility; UI stops sending.
DBtests beforewrites verify propertylocalesqa.local AND SQLdb/rolepropertylocalesqa,
singletonIF0. Only new ownsettingsID, rawcustomlegacyvalues+translations+pending
hours toprove preservation, clearfallback/ENedit/oldomission/activeicons updates,
cleanupONLYnewID+its translations. Refuse existing singleton/no snapshotrestore.
Safeenv /private/tmp/central-hill-building-status-qa/env.sh Node22, externaltestloader
/private/tmp/central-hill-geography-name-locales-qa/backend/test-runtime.mjs plus
NODE_OPTIONS require /private/tmp/central-hill-property-forms-qa/node-runtime.cjs.
No source/core/schema/runtime/foreignfiles/main changes; TS/scopedlint/focusedDBtests.

UI /private/tmp/central-hill-settings-cleanup-ui branch settings-cleanup/ui owns ONLY
Settings admin/ui/globals-form.tsx. Remove Headline stats, Avantio, Buildings listing
cards, stathelpers andwidgetJSONparse, all retiredpayloadkeys; ignore hiddenDTO.
Keep active icons except services_how_1/2/3 controls; submit ONLY EDITABLE_SITE_ICON_KEYS
so backend preservesrawhiddenkeys. Keep form/save/media/controls/layout positions,
no visualredesign. Office existing sharedHoursinput stays; replace singleHoursLabel
with4LabelEN/ES/PT/FR inputs IDs office-hours-label-en/es/pt/fr, max120,busy/errors/
properlabels. EN office_hours_label orNull; targetsfulltrimmedmap, raw authoredblank.
Placeholder OFFICE_HOURS_DEFAULT_LABELS[locale]. Rootmessages
settings.admin.globals.hoursLabels.label({locale}),hint; siteicons.intro updatedbyroot.
Use knownincumbent FieldGrid, no tabs. ReadImpeccablecraft-floor beforeedit; launcher
alreadyranconversation, don'trerun. TS/scopedlint; no DB/browser/runtime/main/schema.

IndependentQA owns ONLY settings-hours-cleanup-qa.md +artifacts, source readonly.
WAITrootproductionREADY afterchecks/build. Three bounded groups: Settings fourHours
Labels/no3legacycards/no3unusedicons/activeicons present; actualSave/reload +4locale
About labels/sharedschedule, ENedit/targetblank/ownindependence/ENclear; validation/
mobile/activeiconchange+legacycols/rawHowicons exact/auth andgenericSettings review
redirect. One ownnew singletonIF0, defaults valid internally; no Page/media content
writes/externalclicks/aestheticshots/geometry/polishloop. TrackID+createdAt, cleanup
ONLYownrow+translations, all42protectedhashes exact/Settings0. No oldsnapshotrestore.
Rootcontrolssole3071 main→productionQA→actualmain and finalreadonlyopening. Preserve
all worktrees/envs/files/caches/oldbuilds/artifacts/logo/publicmedia symlink.

## Checks

Root TS/lint; meaningfulschema/resolver/preservationDB/pureAboutlocale tests +existing
Settings/Website/CTA/Navigation/Owners regressions serialsingletonfiles. Update old
adminschema/Translationguardtests to assert retiredvaluesignored/wholeSettingsblocked
instead of oldStatsworkflow. No tests mirroringmarkup. Build CIRCLE_NODE_TOTAL=3
(2workers) after DBcleanup, scopedindependentproductionbrowser3groups. No schema so
no dbcheck. Finalreadonlyactualmain, no repeatedsuccessfulmatrix/no automaticnexttask.

## Progress

Contracts3fbd487/773139f beforewriters. UI1803c68 integrated953b9a7, scopedlint0/
initialTSonlypendingbackendunknowninputs. Backendbf7ae33 integrated071e890, TS/
scopedlint0 and8guardedDBgroups0, onlyownrow+translationcleanupverifiedSettings0.
Rootd53a321 S14ownership/Pagesdefaultlabel+weekday/puretests+copy, no schema change.
Integrated TS0/lint0(7oldwarnings),102tests0 serialDBfiles.
Main75584 stays until buildready. Sourceunchanged after tests start exceptdocs.

All ownfixtures cleaned after integratedtests; no schema/migration. Source d53a321
unchanged after tests (docs only). Explicit 18 test files below, with TAP evidence in tests.log; updated S14Settingsguardtests assert whole-type retirement,
Navguard othercopy uses unretiredFAQ. Rootindependent42hashcheck precedesbuild.

Actual integrated command after sourcing safeenv/Node22 and the documented NODE_OPTIONS preload:
```sh
pnpm exec tsx --import /private/tmp/central-hill-geography-name-locales-qa/backend/test-runtime.mjs --test --test-concurrency=1 src/slices/settings/tests/settings.test.ts src/slices/settings/tests/settings-admin.test.ts src/slices/settings/tests/owners-phone.test.ts src/slices/settings/tests/owners-phone.integration.test.ts src/slices/settings/tests/website-locales.test.ts src/slices/settings/tests/website-locales.integration.test.ts src/slices/settings/tests/navigation-ctas.test.ts src/slices/settings/tests/navigation-ctas.integration.test.ts src/slices/settings/tests/fixed-navigation.test.ts src/slices/settings/tests/subnav.test.ts src/slices/settings/tests/fixed-navigation.integration.test.ts src/slices/settings/tests/hours-labels.test.ts src/slices/settings/tests/hours-labels.integration.test.ts src/slices/pages/tests/office-hours-labels.test.ts src/slices/translation/tests/fixed-navigation-guards.test.ts src/slices/translation/tests/settings-website-guards.test.ts src/slices/translation/tests/translation.test.ts src/slices/translation/tests/testimonial-quote-guards.test.ts
```

Build0/144routes/2workers on e76c88c (productd53a321). Oldmain75584/75578 stopped
aftercwdverified; soleproductionQA3071 PID12985/parent12979/session95475, integration
cwd/login200verified. IndependentQA runs3boundedgroups, one newownSettingsfixture
only; rootnoDBwrites. Sourceunchanged afterchecks/build; onlyrootdocs updates.

IndependentQA approves e76c88c/productd53a321:3/3boundedgroups firstpass,0pageerrors,
no product/harnesscorrections. ActualSave/reload/About4labelssameschedule, ENchange/
clear/fallback/ownpreservation, mobile/validation, activeiconSave/publicrender and
Settingsreviewredirect/inboxmask allpass. Onlynewfixture9a9b12fd-52e2-46bf-8c43-
0809692cdf3c restoreddefaults+cleaned withits owntranslations; Settings0/42hashesexact
(rootindependentlycomparedJSON). No Page/mediawrites. Sourceunchanged afterQA.

## Local main delivery

QA reportca698c8 approved e76c88c/productd53a321; rootcloseout31deec4. Main
fast-forward7c1a205→31deec4 after trackedclean precheck. QA12985/12979 stopped
aftercwdverification; soleactual-main dev3071 **PID13559/parent13553/session19738**,
cwdworkspaceverified, safe propertylocalesqa DB5658/proxy4558/storage9077 unchanged.
Finalreadonly main-open0: Settings200/4HoursLabels/no3retiredcards/activeicons,
AboutEN/PT200/localizeddefaultsamedaytimes, oldcompany_settingsreview->Settings,
globalTranslations200,0pageerrors. No Save/cacheintervention/repeatedmatrix afterQA;
Settings0 remains/no configseeded merelyforappearance. Evidence main-open.json/
main-restart.log in rootartifact. Finaldoccommit resolvesgitlog-1. Originaluntracked
logo/publicmedia symlink andallworktrees/envs/caches/builds/artifacts/files preserved.
No schema/remoteDB/push/deploy. OtherTranslation/rolecleanup notautomaticallystarted.
