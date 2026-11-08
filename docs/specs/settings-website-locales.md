# Settings Website EN/ES/PT/FR → About — execution

2026-11-07. User requests four Website URL inputs in current Contact ficha, About
shows corresponding locale URL. Base main933becc tracked clean, original logo PNG
and publicmedia symlink untracked preserved. Local main/sole3071, no push/deploy/
remote writes. Current actual-main dev3071PID97374/parent97368/session54450;
synthetic propertylocalesqa DB5658/proxy4558/storage9077, user is now Admin.

## Inventory/contract

Website EN currently inline website_url nullable; URL HTTPS/max300, blank hides
About office row. getGlobals(locale).website already feeds About.officeRows, which
keeps exact href and displays without scheme/trailing slash. Only About consumes
this Website field; canonical siteURL/SEO/booking destinations are separate.
Read-only preflight: singleton0, zero company_settings.website_url translationrows.
No DB schema needed; existing synthetic-content authorization reused.

Canonical EN remains inline column, no EN translation row written or deleted.
New optional admin website_translations:{es,pt,fr}:string: full strict three keys
if present, trim/HTTPS/max300 or blank. Old omission preserves all raw targets.
New UI submits all fields, raw pending/authored target values and missing blanks,
no EN copies. Nonblank Save manually approved via core setTargetTranslation with
sourceValue inlineEN or empty; non-page seam permits own URL when EN blank. Blank
removes only Website target/locale via deleteTranslation. No source clear across
languages; existing source EN translation rows, if any, preserved but ignored.
Public: EN always inline trim/null; selected approved valid HTTPS target else inline
EN trim/null. Pending/missing/invalid target never public. ENclear hides EN/empty
languages but keeps own target URL. Label from About page stays unchanged.

getGlobals cache shapev4; selected target-row read via core loadTranslationRows
(locale only), no new kernel API. Existing global-tag/layout revalidation covers
all four About URLs without Page Save/Publish/JSON/SEO/snapshot changes. Inputs
WebsiteEN/ES/PT/FR in same Contact card, no tabs, one Save, IDs/labels/max/errors/
busy and HTTPS hints in four languages. Keep other fields/styles/control positions.

Field-level legacy ownership: isSettingsWebsiteField(type,field) exact Website
company_settings. Root filters only that field from inbox+entity review; single
legacy actions reject it, approveEntity skips it, generator ignores it even if an
old EN translation row exists. Stats/hours/nav and other types unchanged. No data
rows deleted by retirement. Global Translations remains for remaining work.

## Owners/order

Root prepares contracts before consumers: website-locale-types.ts,
admin/validation.ts, EditData optional field in admin/queries.ts, contract export,
ADR0072/index/spec. Root owns messages4, Translation admin/actions.ts/queries.ts,
server/generate.ts + README; Settings README/data-model/roadmap/AGENTS; new tests/
website-locales.test.ts and Translation tests/settings-website-guards.test.ts;
fixtures/runtime/integration. No core/schema/package/migration changes.
Integration /private/tmp/central-hill-settings-website-locales-integration branch
settings-website-locales/integration.

Backend /private/tmp/central-hill-settings-website-locales-backend branch
settings-website-locales/backend: owns ONLY settings/admin/actions.ts,
admin/queries.ts (implementation retain prepared interface), server/queries.ts,
new server/website-locales.ts and tests/website-locales.integration.test.ts.
Helpers expected: rawWebsiteTranslations(rows) maps only targetWebsite fields
includingpending; resolveWebsiteUrl(baseEN,locale,rows) public policy above;
saveWebsiteTranslations(id,baseEN,targets?,updatedBy?) target-only writes. No EN
translation mirroring, no URL columns. Public existing loadContent still used for
stats/hours, separate selected-locale raw rows for URL state. Admin raw query all
locales. Save calls helper after inline row ID resolved. Old payload omission no
writes to targetWebsite rows. DBtests only guardEMPTYsingleton/newownID then cleanup
ONLY thatrow/its translations. No schema/migration/runtime/otherwriters edits.

UI /private/tmp/central-hill-settings-website-locales-ui branch
settings-website-locales/ui owns ONLY settings/admin/ui/globals-form.tsx. Replace
one Website field with four grouped fields in same Contact card (col-span-full
FieldGrid), no new tabs/cards/editor. EN uses website_url; targets optional raw
website_translations. IDs website-url-en/es/pt/fr, typeurl/max300, propererrorpaths,
disabledpending/preparing, placeholdershttps. Full trimmed stringtargetpayload,
EN existingorNull. Root messages admin.globals.websiteLocales.label({locale}),
sourceHint, fallbackHint. Impeccable context launcher already ran conversation,
read craft-floor before edit; incumbent form is visual authority. No aesthetics/
screenshots/tests mirroring markup/new helpers required. Scoped TS/lint.

Root integrates sequentially and runs TS/lint, focused pure+DB tests including
legacy field guards and About office renderer contract as appropriate, then build
2workers after DBcleanup. Independent QA owns ONLY settings-website-locales-qa.md
and own artifacts: three normal bounded groups NewSettingsraw/Save+reload/4URLs,
About4locale real href/text+fallback after ENedit/targetclear, ENclear with ownURL/
mobile/validation/auth/legacyguards. No broad known-stale Pages matrix, screenshots
or repeated successful groups. Never alter existing About/Page content or pubs.

## Data/runtime safety

Artifacts /private/tmp/central-hill-settings-website-locales-qa. Safeenv
/private/tmp/central-hill-building-status-qa/env.sh Node22. Verify hostname + SQL
DB/role propertylocalesqa before any writes. Only new synthetic singleton IF0,
assert beforefirstwrite and identify returned newID, cleanup only thatrow and its
new translationrows. Refuse if user has created Settings meanwhile; never delete/
snapshotrestore old singleton. Existing contact/Owners/WA/Avantio and all old42
business hashes protected; PageJSON/pub/rev/SEO unchanged. Temporary URLs use
*.example.invalid, no link clicking/external sends. No singleton seeded to make
final UI appear configured. Current first-Save scaffold uses real existing
bk_centralhill account and is valid; do not invent fake booking config.

Root controls sole3071 main→productionQA→actual-main; final read-only opening.
No user DB schema approval needed because no schema change. No automatic further
Settings copy/nav/ALT/role removal or global Translations retirement after task.
