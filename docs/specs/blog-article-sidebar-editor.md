# Blog article sidebar editor in context — 2026-11-05

User explicitly requests removing Post aside from listing editing and a separate
editor showing a sample article in context. Base509d785/main/current checkout;
preserve pending work/logo, remote Neon env and3071. Bounded root implementation.

Plan/contracts: /admin/pages/blog keeps Hero/Journal/Newsletter + SEO; new staff
/admin/pages/blog/article-sidebar shows only the shared article CTA. Both access
the existing Blog per-locale snapshots/revisions/actions (no new row/schema or
independent publish unit). Navigation explains shared drafts and uses the existing
unsaved guard across views. No hidden fields are dropped from the full envelope.

Reuse public BlogPost composition through an injectable renderer; private sample
article uses localized illustrative body, index, actual detail grid/sticky aside,
shared CTA and disabled newsletter. No public sample route, post DB record, real
post write or own-post CTA override. shared_aside surface now renders this sample
through the same adapter/action for initial/ephemeral preview. Public callers keep
original behavior/SEO/locale URLs and post-specific CTA precedence.

Root write set: new Pages admin/editorial-views.ts + test, contextual editor,
page-navigation, new staff route; Blog adapter; BlogPost/BlogSharedAside + new
sample helper/renderer/tests + contract/README; Backoffice workspace route matcher
if required;4messages JSON; Pages README, this report/current handoff. No kernel,
DB/migration, save/publish implementation, package or real Forms/send changes.

Acceptance: listing hides aside, dedicated editor exposes only4CTA fields; both
views reachable with Cancel/Continue protection for local work. All4locales live
render in actual article context/Refresh, sample body unaffected, owner href stays
localized, public article and post override preserved. Node22 scoped tests,
typecheck/lint/compile with unreachable synthetic DB; bounded isolated browser
fixture for both routes/surfaces/navigation/mobile; no real staff/DB save/publish,
upload/form send, commit/push/deploy or3071restart.

## Delivered behavior

Implemented separate staff route and Blog navigation tabs with existing native
Cancel/Continue/Escape guard, including unsaved work in another started locale.
Listing exposes3sections + SEO; article view exposes only the4shared CTA fields
and describes the sample/global scope. Focused workspace also covers the new
nested route. No draft/publish/store/SQL implementation changed: complete Blog
envelopes remain intact, share revision/CAS and are published per locale as before.
The tabs explicitly explain that Save/Publish concern that complete Blog draft.

`BlogPost` still loads a real post and calls the extracted `BlogPostRenderer`.
`BlogArticlePreview` injects localized sample body/headings with no individual CTA
override and the selected editorial snapshot. It reuses the actual DetailTitle,
BodyRenderer, TOC, DetailLayout and380px StickyAside. Private BlogSharedAside now
adds only its binding inside that aside; the old isolated420px study is removed.
Sample emits no JSON-LD and its newsletter is inert/disabled through existing
preview behavior. Public article defaults, JSON-LD, per-post CTA precedence and
newsletter remain unchanged. No sample is stored or exposed on a public route.

## Verification and limits

Node22 on the pending working tree:
- `pnpm exec tsx --tsconfig src/slices/pages/tests/tsconfig.json --test
  src/slices/pages/tests/blog-editor-views.test.ts
  src/slices/pages/tests/blog-editorial-adapter.test.ts
  src/slices/backoffice/tests/page-editor-bridge.test.ts`:13/13 exit0,3new cases.
- `pnpm typecheck`:0. `pnpm lint`:0 with7existing unrelated warnings.
- `pnpm build --experimental-build-mode compile`:0 with synthetic unreachable DB
  URL and no prerender; confirms new staff route. Fixture `next build --webpack`:0
  including TypeScript. The initial fixture pinned all server messages to EN;
  switching it to the real i18n/request configuration corrected the fixture-only
  sample-localization check. Product code needed no correction.

DB-free production fixture3185 uses actual editor/navigation/bridges/server action/
adapter and real Blog listing/article renderers. Staff/store/media/catalogue/
Settings/Home band/Brevo form are stubbed; persistence/upload actions disabled.
Its wrapper routes mount the same editor modes; real staff route is source-reviewed
and compiled, without logging into3071or querying/writing its remote DB.

Chromium final pass: listing3options vs article1option/4fields; clean navigation;
EN/ES/PT/FR each edit all4fields in the actual article sidebar, retain localized
Owners href, sample title/body/index and stable iframe across Refresh/reopening.
Desktop actual iframe confirms aside beside article at380px; mobile390px stacks
it below article and live edit works. Cancel/Escape retain local CTA, Continue
navigates to listing; unsaved ES listing work still warns from the EN tab. Public
injected article in all4locales retains JSON-LD/no private annotations, default
localized Owners link and individual-post button override with shared title.
Zero browser errors;27POSTs only to synthetic preview. No real form submit or
content save/publish/persistence claim; sample/public snapshots are injected.

Artifacts `/private/tmp/central-hill-blog-article-editor-fixture/`: fixture/config,
`check.mjs`, `browser-result.json`, build-fixture.log/build-product.log, tests.log,
typecheck.log/lint.log. Initial product typecheck/lint logs also retained under
`/private/tmp/central-hill-blog-article-*.log`. `git diff --check`:0.
Temporary3185stopped;3071PID7039 preserved. No automatic aesthetic QA, broad
adversarial suite, independent QA claim, DB/migration/upload/send/commit/push/deploy.
