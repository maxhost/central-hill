# Independent QA — Settings Website locales

2026-11-07. **Approved executable fda13a4**, integration branch
`settings-website-locales/integration`, base main933becc. Independent source review
and three bounded functional browser groups found no product defect. No product
source correction was made during QA.

## Environment and evidence

Read AGENTS.md, CLAUDE.md, canonical multi-agent workflow, active execution spec and
ADR0072. Tested real production Next candidate on localhost3071 after root's READY:
PID40169/parent40163, integration cwd. Root owns runtime and final main opening;
QA did not start/stop servers, modify caches or change environment configuration.
Chromium used existing authenticated Admin state, desktop1440×1000 and mobile
390×844. No screenshots, external link clicks, aesthetic loop or broad Pages suite.

Before writes, independently verified DATABASE_URL hostname propertylocalesqa.local
and SQL database/role propertylocalesqa. Existing synthetic DB5658/proxy4558 and
storage9077 were retained. company_settings was empty and all42 business-table
count/hash pairs matched root's pre-implementation baseline. Auth tables excluded.

Artifacts: `/private/tmp/central-hill-settings-website-locales-qa/independent/`:

- `common.mjs`, `check.mjs`, `resume.mjs`, `finish.mjs`: actual browser/SQL harnesses.
- `attempt1-browser.log`, `attempt1-result.json`, `attempt1-owned.json`:
  first setup, raw form/validation and Save/reload evidence.
- `attempt2-browser.log`, `attempt2-result.json`, `attempt2-owned.json`:
  four-locale public behavior, independence, mobile/validation/auth evidence.
- `finish.log`, `result.json`: pending review assertion, final approval and cleanup.
- `protected-before.json`, `protected-after.json`: exact unchanged42-table evidence.

Commands sourced existing safeenv
`/private/tmp/central-hill-building-status-qa/env.sh` using Node22. `QA_PREFLIGHT_ONLY=1
node .../common.mjs` exited0. Final `node .../finish.mjs` exited0. Earlier browser
commands exited1 on the harness-only assertions explained below; their successful
checks were retained and only unfinished checks continued.

## Functional results

1. Settings exposes exactly four Website EN/ES/PT/FR URL inputs in existing Contact
   form, no tabs, typeurl/max300 and associated labels. Missing singleton scaffolds
   original EN URL, blank targets and already-used Avantio account bk_centralhill.
   Target HTTP input produces error on ES only, retains input and creates no row.
   Actual Save creates one owned singleton with four distinct HTTPS URLs; reload
   shows authored values. About EN/ES/PT/FR each renders corresponding exact href
   and visible URL text without scheme, preserving its existing Website label.
2. Subsequent EN change updates empty ES through current-EN fallback while PT/FR
   own URLs remain. Clearing EN stores null, hides Website in EN/emptyES and keeps
   PT/FR own rows. ES can then own a URL with EN empty. Actual approved translation
   rows and absence of EN Website translation were checked. Save revalidates public
   About without any Page Save/Publish. Neutral Settings attributes, contact links,
   per-locale title/canonical and protected Page content/publication/revision data
   remain unchanged after initial singleton creation.
3. Mobile Save/reload works; invalid HTTP on FR retains attempted input but leaves
   inline Settings and all own translation rows exact. Reload recovers stored FR.
   Anonymous Settings redirects to login. Generic company_settings review retains
   Stats and excludes Website field/URLs. Scaffold Hours label is blank, so no Hours
   row was invented just for QA; source review and root guard tests cover preserving
   the legacy Hours workflow. Finally actual Settings Save restores default EN URL
   and blank targets before guarded cleanup.

Every observed browser pageerror list was empty. About links were inspected,
never followed. No Page or media content was written. First singleton creation
naturally enables configured check-in/office details; neutral-contact comparisons
start after that first Save, while Page snapshots remain protected throughout.

## Source/adversarial review

Canonical EN remains existing website_url column; target inputs load raw authored
values including pending, and omitted targets preserve old clients. Nonblank target
Save uses approved manual core write; blank removes only matching target Website.
Public target selection requires approved HTTPS, otherwise canonical inline EN;
legacy EN translation rows are ignored/preserved. EN clear leaves own targets.
Existing getGlobals(locale) feeds About; cache shapev4 and existing globals/layout
revalidation cover changes. No Page/SEO domain, booking URL, other contact, schema,
package or kernel changes were introduced.

Field-only legacy guard masks Website from inbox/review, rejects individual legacy
writes, skips Website bulk approval/generation and preserves Stats/Hours behavior.
Root's actual57 tests (41pure+16DB, serial singleton files), typecheck and lint logs
were inspected: exits0,57pass/0fail,7 existing lint warnings. Root reported integrated
build0/144pages with2workers; build route output was inspected. QA did not repeat
those passing checks or claim an unrelated broad suite passed.

## Harness adjustments and cleanup

Two harness assertions required correction without product changes. Initial About
selector used the first contact h3, which belongs to a photo card; it was scoped to
ContactSplit's office panel. Generic-review labels use CSS uppercase; visible text
was normalized before checking raw field names. Each failed attempt defensively
cleaned its own new fixture, so only necessary setup for unfinished checks was
recreated. Passed groups were not repeated.

Three serial newly-created Settings IDs were observed and removed, never more than
one at once:

- de1a6519-3709-4d0e-97da-b921f4fbc39e
- a8ab0bb4-8f12-47b0-9f35-4c903b34ae45
- 8fdeb1e6-099e-4323-a74b-b3023ee27044

Creation-time/ID/account guards verified ownership; cleanup deleted only those IDs
and their own company_settings translation rows. No existing singleton was
snapshot/deleted/restored. Final singleton count0 and all42 protected table hashes
exactly match baseline, including all pre-existing translations/Pages/media.
No schema, remote write, main merge, push or deploy by QA.

After direct fixture cleanup, candidate public caches may still contain its prior
fixture values; QA did not intervene. Root's final actual-main fresh runtime/read-only
opening is separate. With no singleton, existing About behavior hides Website until
the admin Saves real Settings, although Settings EN scaffold shows the default URL.
