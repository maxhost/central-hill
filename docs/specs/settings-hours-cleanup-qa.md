# Independent QA — Settings hours labels and cleanup

2026-11-07. **Approved candidate `e76c88c` (product source `d53a321`)**, branch
`settings-cleanup/integration`, base main `7c1a205`. Independent source review and
three bounded functional browser groups passed on the first run. No product or
harness correction was required during this QA.

## Environment and evidence

Read AGENTS.md, CLAUDE.md, authoritative multi-agent workflow, executable
[plan](settings-hours-cleanup.md) and ADR0075. Verified integration cwd/branch and
source state. Root supplied production READY3071 after its checks/build:
PID12985/parent12979/session95475, integration cwd verified by root. QA did not
start/stop servers, change environment, manually invalidate caches, merge main,
push or deploy.

Chromium used existing authenticated Admin state, desktop1440×1000 and mobile
390×844. No screenshots, aesthetic/geometry loop, broad Pages matrix, external
link clicks, booking/search submissions, Page edits or media uploads.

Before writes, independently verified DATABASE_URL hostname propertylocalesqa.local
and SQL database/role propertylocalesqa. Existing synthetic DB5658/proxy4558 and
storage9077 retained. company_settings was empty and all42 business-table count/
hash pairs exactly matched root's protected baseline; auth tables excluded.

Artifacts under `/private/tmp/central-hill-settings-cleanup-qa/independent/`:

- `check.mjs`: guarded actual browser/SQL harness; QA_READY gate prevents early runs.
- `browser.log`, `result.json`: first-run three-group approval,0pageerrors and cleanup.
- `owned.json`: new fixture ID/creation time/synthetic email ownership evidence.
- `protected-before.json`, `protected-after.json`: exact42-table preservation proof.

Commands sourced existing safeenv
`/private/tmp/central-hill-building-status-qa/env.sh` with Node22. Syntax check0;
`QA_READY=1 QA_PREFLIGHT_ONLY=1 node .../check.mjs` exited0 after root's DB cleanup.
After production READY, `QA_READY=1 QA_SOURCE=e76c88c node .../check.mjs` exited0.
No browser request or content write ran before READY.

## Functional results

1. Settings exposes four associated Hours Label EN/ES/PT/FR inputs, raw blanks,
   correct localized placeholders, max120 and no tabs. Headline stats, Avantio and
   Buildings listing cards are absent. Three unused services_how controls are absent;
   account/contact/language, apartment specs, Blog, Guide and Service default icon
   controls remain. About's four locales initially render localized default headings/
   weekdays with the same09:30–18:00 range. Exceeding ES max120 produces the correct
   field error, retains the attempted input and creates no Settings row. One actual
   Save creates an owned singleton from active fields, supplying internal account
   bk_centralhill without a visible Avantio control. Reload retains four authored
   labels; each public About locale shows its own label and the exact same authored
   schedule10:15–17:45. No legacy EN hours or stat translation rows are materialized.
2. Changing EN and clearing ES causes ES to use current EN, while own PT/FR labels
   remain. Clearing EN stores null, selects localized defaults for EN/emptyES and
   preserves PT/FR ownership. ES can then author an independent label with EN empty.
   Raw inputs, approved target rows and deleted empty target are correct. Every Save
   refreshes public About without Page Save/Publish. Shared schedule, neutral Settings
   columns, legacy columns/retired How icons, contacts, per-locale title/canonical and
   all old Page content/publication/revision data remain unchanged after fixture setup.
3. An actual active account-icon picker change to user-circle saves/reloads and
   changes the public header SVG; retired How values and other neutral configuration
   stay exact. Mobile Save/reload works and updates About. Invalid FR max120 input
   retains the attempted value/error but preserves the entire stored row/translations;
   reload restores the stored value and native maxlength. Anonymous Settings redirects
   to login. A legacy company_settings translation review redirects to Settings;
   filtered inbox has no editable company_settings review link. Finally the same
   owned form restores default email/account icon and clears hours/labels before
   cleanup. Other generic Translation types remain available by source/root tests.

Every browser pageerror list was empty. Max-length server validation was exercised
by removing the native maxlength attribute only in the test DOM before entering121
characters; ordinary UI retains maxlength120. The office assertion scopes the actual
ContactSplit dark panel inside #contact, not earlier photo cards, and reads raw
textContent rather than CSS-uppercase innerText.

## Source and existing-check review

EN hours label stays canonical inline; raw target inputs include pending authored
values and omission preserves targets. Manual Save writes approved targets only,
empty clears only that locale, legacy EN rows stay untouched. Public targets must
be approved and valid-length; fallback is nonblank inline EN then locale default.
Authored shared schedule is never translated or rewritten; only blank uses localized
weekday fallback. Globals cachev6 and existing globals/layout invalidation cover it.

Retired stats/Avantio/listing payload fields are ignored unconditionally; existing
raw columns and legacy translations remain, new singleton uses existing internal
defaults. Active icon keys merge with raw stored icons, preserving retired/unknown
keys. Active Avantio widget code/account is unchanged and independent of removed
Settings controls. Global icons are still live defaults for multiple UI consumers;
Service-specific overrides remain authoritative.

All company_settings generic inbox/review/single/bulk/generation paths retire and
old review redirects to Settings. Source/root guard tests cover these direct actions;
QA did not duplicate the direct-action matrix through browser. Legacy data is kept,
no schema/kernel API/package changes or global Translations removal.

Root102tests/0fail, typecheck0, lint0 with7oldwarnings and build0 logs/exitfiles were
inspected; production build generated144pages with2workers. The8 dedicated backend
DB groups additionally exercise custom raw legacy columns/icons and legacy EN/pending
hours preservation. Browser preservation comparisons use the defaults created by
its own first Save; no claim that it seeded arbitrary legacy data through the UI.

## Ownership and cleanup

Only one new Settings row was created:
`9a9b12fd-52e2-46bf-8c43-0809692cdf3c`. Fresh-empty-table, unique synthetic email,
creation time, ID and internal account guards established ownership before cleanup.
No existing singleton was replaced, snapshotted, deleted or restored. Cleanup deleted
only that ID and its own company_settings translation rows. Final Settings count0
and all42 protected business-table hashes exactly match root baseline, including
all pre-existing translations/Pages/media. No schema or remote action by QA.

After direct fixture cleanup, candidate caches may retain its prior configured
contact object until root's final runtime switch; QA did not intervene. Final actual-
main opening is root's separate read-only delivery check. No synthetic Settings row
is retained merely to make the final UI appear configured.
