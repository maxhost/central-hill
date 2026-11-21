# Footer legal pages — execution

2026-11-21. Scope and restore procedure: [plan](legal-pages-plan.md).

## Checkpoint before implementation

Base29ef54278e176ed6d655def475901ce1e71527a9, branch
restore/legal-pages-2026-11-21. Private artifact root
/private/tmp/central-hill-legal-pages. Bundle verified. Complete49tables1524rows
restored into legalpagesrestore20261121 (intact) and legalpagesqa20261121 (own QA).
Effective columns/constraints/counts/row hashes exact; dropped-column physical ordinal
gaps normalized only. Source tar, original env/logos/media symlinks and actual current
empty media target contents retained. Private checkpoint/RESTORE.md preserves later
state first and restores in a new checkout/database. No productionDB/R2 writes.

## Implementation

Two implementers A/B coordinated explicit contracts in the shared checkout, with
root-only checkpoint/provision/build and independent third-agent QA. Backend A adds
three typed legal keys/adapters to the existing editorial lifecycle; no migration,
new table or authored-main fixtures. Descriptor flag localeIndependentContent is
scoped to those keys: each locale retains its complete Rich document/SEO and working
snapshot. Save/Publish still enforce auth, revisions and template CAS. Legacy bootstrap
returns no fabricated published documents. Public reader accepts only a valid own
publication or complete EN publication; PT/FR drafts never replace fallback.

B reuses the existing Blog Rich editor through explicit pure/client/server contracts,
with textOnly capability for legal Pages; Blog default options remain unchanged.
Contextual editor/iframe bindings and locale tabs are reused. Public routes share the
existing locale layout and hide editing annotations. Footer Others is translated and
filters absent publications; navbar remains unchanged. Desktop grid gains a fourth
column only when Others is visible. EN Publish refreshes all fallback locales and
layouts; target Publish refreshes that locale; sitemap refreshed on legal Publish.

## Root validation

- Typecheck passed (implementers and isolated Next build TypeScript).
-6legal domain cases, plus20targeted codec/render/nav/field cases:26passed.
- Full lint:0errors,7preexisting warnings.
- Migration static check:32consistent; old0008breakpoint warning unchanged.
- UI mechanical detector (B):[]; diff whitespace check clean.
- Broader editorial checks:70cases,62pass/8fail. All8failures independently reproduced
  with identical test names at untouched baseline29ef542. They concern preexisting
  Guides hidden city_filter binding, old marketing layout/hidden-field expectations,
  missing old Guest link labels and About media hints. Not declared passing.

Harness-only corrections: Rich renderer tests need react-jsx tsconfig, not jsx preserve.
First isolated build failed because node_modules symlink escaped Turbopack root; replaced
with a task-owned filesystem clone. Sandbox blocked Turbopack internal local sockets;
reran isolated build with granted permissions. One initial build command was accidentally
started in authored main cwd and immediately interrupted during compile (no content
writes); all subsequent build/QA use task-owned copy/env/cache. Main dev uses .next/dev.

Isolated runtime config only caps2workers/static concurrency1; product next.config.ts
unchanged. Build uses strict exact QA DB/role/host NeonHTTP guard via local4558. Runtime
source matches main src/messages exactly (product-source.json); private env never shipped.

## Production build

Isolated Next16.2.9 production build exited0:227static generations,2workers,
compile9.9s, TypeScript11.0s. Build-only worker/static concurrency limits; product
config unchanged. Standard metadataBase warning occurred on existing fallback pages.
Production QA3090 started with exact QA preload/env in task-owned copy/cache.

Browser/conservation results are appended after independent QA.

## Main local opening

The inherited3071 listener was no longer present at final read-only opening. Reopened
same checkout with original .env.local and the already established strict main preload
/private/tmp/central-hill-navbar-logo/runtime.cjs (onlyneoncontentlocal20261111 via4558).
No env change, auth login, Save/Publish, cache reset or media restart. Media9081PID8524
retained. Read-only main checks: /admin/login200 and all three EN legal routes404,
consistent with absence of any authored/public legal content on main. No QA copies.

## Focused QA correction — first navigation after Publish

Privacy E2E exposed stale content on the first Footer navigation after EN Publish
in a browser that had already visited the page. SQL had the new EN document and ES
snapshot/revision/timestamps remained exact; full HTML and full RSC fetched immediately
afterward also had the new document. A reproduced this with normal BO login/edit/Publish
and same-context warm visit. CDP showed no disk/prefetch HTTP cache hit; the discrepancy
was the static segment-RSC navigation layer, not a stale database/getLegalPage value.
Private qa/cache-diagnostic.json/script retain exact headers/title evidence.

Correction B is limited to the three public route files: force-dynamic removes the
static route/segment caching policy, while the explicit tagged getLegalPage data cache
is retained. No global cache setting, Footer reload workaround, or shared-page policy
change. Initial build/source manifest retained as initial-build.next,
build-initial.log and product-source-initial.json; corrected build/source recorded
separately. No domain/schema/editor/footer changes after the initial candidate.

Harness corrections before that confirmed defect: timestamp report keys lowercased;
wait for real Save/Publish UI completion after SQL commit before navigating. Failure
videos and partial first-publication evidence remain preserved; not counted as passes.

Corrected isolated build exited0: compile10.5s, TypeScript14.5s,227generation work
items completed in2.7s with2workers and warm cache. All three legal routes are explicitly
listed dynamic (ƒ); common pages retain their prior route policy. Scoped route ESLint0.
Root compared all943src/messages files against the runtime and candidate SHA256 manifest:
exact. Final browser QA uses this corrected build, with no HTTP warm-up before Footer
navigation. Initial source/build/videos retained separately.

## Final independent QA and handoff

Independent QA APPROVED the corrected943file candidate, manifest SHA256
6355555b9e63900af798e81aa09fe02150a66cfc3fed9a40dc49853408b216f6.
20recorded E2E groups (Privacy6rerun, Cookies7firstpass, Complaints7firstpass),
3state/Blog compatibility groups and8additional browser groups passed; final0pageerrors/
0HTTP5xx. Three valid VP8/WebM recordings1440x1000/25fps:28.08s,29.44s,27.60s.
[Independent report and video links](legal-pages-qa.md).

Root reviewed all8existing desktop/mobile screenshots in one bounded visual batch.
New reading layout, Others column and responsive wrapping are legible without horizontal
overflow. Existing floating CTAs can overlay Newsletter at some scroll positions;
retained outside this task, not claimed as a clean global chrome audit. No further UI edits.

QA43protected business tables1473original rows plus all32ledger rows exact. Main full
49tables1524rows/schema/constraints/hashes exact after read-only openings. Original
.env.local, every logo file and both media symlink definitions compared to checkpoint:
exact. Final source matches built/approved manifest. Private final-receipt.json records
these boundaries; no credentials/headers in delivered repo artifacts. Diagnostic HTTP
headers were sanitized to omit auth/cookies and never used for login/replay.

Owned QA3090 stopped after QA closed every browser/context and completed final checks.
Main3071PID73739/session68996 and original media9081PID8524 remain. Main current strict
preload is /private/tmp/central-hill-navbar-logo/runtime.cjs, with original env and only
neoncontentlocal20261111 via4558. All earlier DBs/artifacts/envs/caches/builds retained.
No product commit/push/deploy, SQL migration, authored-main fixtures or legal publication.
Admins can now author actual legal text from Pages on3071; footer links appear on Publish.

## Commit authorization

After successful review and local login, user explicitly requested the commit and
confirmed main as the intended branch. All943product source files still match the
approved build manifest. Commit includes source, localized labels, tests/harness and
documentation only. Local env/passwords/database/video artifacts and the original
untracked logo/media symlinks are excluded. No Git push or deployment authorized here.
