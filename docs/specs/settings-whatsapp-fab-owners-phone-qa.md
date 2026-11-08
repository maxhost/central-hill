# Settings WhatsApp FAB — independent QA

2026-11-07. Source `d38e77e` on `settings-whatsapp/integration`,
`/private/tmp/central-hill-settings-whatsapp-integration`; baseline `9866489`.
QA owns only this report and artifacts under
`/private/tmp/central-hill-settings-whatsapp-qa/independent/`.

Status: **APPROVED** for product source `d38e77e`. One bounded browser run passed
four locales plus mobile EN, zero page errors, and exact before/after read-only
snapshots. No source correction or harness retry was needed.

## Scope and source review

Read AGENTS.md, CLAUDE.md, workflow and active execution spec. Verified cwd/branch/
HEAD/status: only existing logo and public-media symlink were untracked. Root kept
this two-source-file task under the simple-task exception. No product edits,
listeners, cache management, DB writes or nested delegation by QA.

The validated LocaleLayout locale is passed to WhatsAppFab; invalid locales still
notFound before rendering. FAB reads cached getGlobals(locale). A missing singleton
uses the shared DEFAULT_GLOBALS.whatsapp, while an existing explicit blank/null or
no-digit value hides only the WhatsApp anchor. Digits are normalized for wa.me.
Owners navigation, existing styles and WhatsApp target=_blank with noopener
noreferrer remain. Existing settings Save calls revalidateGlobals, which updates
the globals tag and all locale layout paths, so no page publication is introduced.
No schema, new fields, API, kernel or package change.

Root's actual-component SSR fixture proof passed ten cases: four locale propagation
cases with a formatted custom number, missing-singleton shared default, four
blank/null/no-digit variants, then a changed custom number. It renders the real
component with test-only getGlobals/translation/navigation seams and asserts Owners
link preservation and WhatsApp new-tab attributes. Reviewed component-check.mts,
test-loader.mjs and component.log. This proof does not mutate a singleton or claim
a real Settings Save/revalidation browser test. Root typecheck/lint exit markers
are both0 (lint has seven existing warnings); root build.exit is0, 144 routes
with two workers. Reviewed the completed build log and markers.

## Environment and bounded public acceptance

Preflight requires DATABASE_URL hostname propertylocalesqa.local and SQL
current_database/current_user both propertylocalesqa. Uses the existing local
DB5658/proxy4558/storage9077 via the safeenv; no credentials copied or printed.
Read-only snapshots of company_settings and translation are stored in before.json
and compared after browser checks. Current company_settings singleton is absent,
so actual public browser checks use the shared defaults. No new singleton/page/
fixture or real external WhatsApp navigation is created for testing.

Prepared one bounded public run: Guests EN/ES/PT/FR plus mobile EN; verify the
unique floating WhatsApp URL/new-tab attributes, localized Owners link, current
footer booking/check-in/email/WhatsApp data and no separate Owners phone. No
screenshots, aesthetic checks, expansion into a broad matrix or repeated functional
runs after success. Root supplied READY for the sole production3071 candidate
PID77358/session46392, source d38e77e, before the browser run. Main/server/cache
management remained with root.

All five visits returned200. Every active-locale FAB had the expected shared
Settings/default URL `https://wa.me/351910075725`, target `_blank` and
`noopener noreferrer`; the adjacent Owners link retained its active-language
`/{locale}/owners` destination. Desktop EN/ES/PT/FR and mobile EN passed. Footer
booking and check-in telephone links, email and WhatsApp matched the current
shared defaults; no +351910438062 or separate Owners phone appeared. No page
errors occurred. `browser-result.json` records each observation; before.json and
after.json are identical for company_settings and translation, including their
row counts and full-row aggregate hashes.

Commands ran in the integration checkout, Node22 with the existing safeenv:

```sh
QA_PREFLIGHT_ONLY=1 node /private/tmp/central-hill-settings-whatsapp-qa/independent/check.mjs # exit0
node /private/tmp/central-hill-settings-whatsapp-qa/independent/check.mjs # exit0
```

Local HTTP/DB/Chromium used exec sandbox escalation. No outbound WhatsApp link was
opened, no Settings Save/publication, row/file upload or new fixture was performed.
Source supports configured numbers and blank hiding; browser covered the current
absent-singleton/default condition, while those configured/blank branches are
covered by root's actual-component SSR fixtures and source review. A real Settings
Save was deliberately not manufactured against the current absent singleton.

## Owners phone audit limits

Root's guarded local scan reviewed42 public business tables (auth tables excluded)
and found no +351910438062 match; current source/messages/scripts/docs/mock search
also found no prior use. Reviewed owners-phone-audit.json. Current footer composes
Phone as Bookings, Check-in phone, Email and WhatsApp; no dedicated Owners phone
field/row exists. Owners fallback contact uses the general Phone. This is a local
code/data audit, not a remote production review or authorization to add/change a
number.
