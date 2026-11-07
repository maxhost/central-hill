# Blog author/category locale inputs — independent functional QA

2026-11-07. Assembled candidate `c155184`, branch
`blog-reference-locales/integration`, worktree
`/private/tmp/central-hill-blog-reference-locales-integration`, base main `6445c99`.
Scope follows [execution](blog-reference-locales.md) and ADR0067. QA owns this
report and its private artifacts only; no product edits, runtime changes, schema
changes, nested delegation, main merge, push or deployment.

**Independent functional/source approval: `c155184`. All three bounded browser groups pass.**

## Source review

Reviewed integrated validation, helpers, admin Save/read/options, both forms,
payload helpers, Post option labels, public reference readers and Blog translation
policy. Manual inputs preserve one author/category identity; only displayed labels
change with Post locale. Source-only EN bio clear is explicit through the new core
flag; default kernel clear behavior remains unchanged. Target fields clear one
field/locale independently, and omitted translations retain old-client data.
Raw pending values are loaded without English copies; public readers accept only
approved targets with EN fallback. EN names reject whitespace before writes.

Public listing, featured, detail, related and private-preview reference resolution
already use `loadContent(locale)`. Relevant public reads subscribe to Blog's list
tag, invalidated by author/category Save; admin Post layouts also invalidate.
Post snapshots retain reference IDs, not copied author/category prose. Policy
excludes both reference types from generic inbox/actions/generation and redirects
old review links to their single forms. Existing delete reference guards remain.
No source blocker identified. Staff guards remain at Save actions and routes;
anonymous access was also checked against the real production runtime.

## Environment and protected data

Root supplied production candidate `c155184` on the sole localhost3071 listener,
PID31418, after build0/136pages and e800 cleanup. Existing synthetic
propertylocalesqa DB5658/proxy4558/storage9077; safe environment
`/private/tmp/central-hill-building-status-qa/env.sh`, Node22. Every harness entry
verifies hostname `propertylocalesqa.local` and SQL database+role
`propertylocalesqa` before content writes. Reused existing synthetic admin session;
no credential copying or external requests/submissions.

Only new owned e801 fixtures, fresh author/category IDs returned by New forms and
their own media may change. Exact IDs live in
`/private/tmp/central-hill-blog-reference-locales-qa/independent/owned-ids.json`.
Existing d300 media is a read-only reference. e800 backend fixtures are excluded
from protected hashes and cleaned by root. All42business tables are protected,
excluding auth and owned identities/relations. Separate snapshots freeze both
owned posts' complete identity and locale rows, including content, revision and
publication timestamps, plus immutable author/category neutral fields.

Preflight passed before browser writes. Root additionally compared this baseline
against its pre-seed snapshot: all42old-business hashes/counts match through
seeding and store tests (`store-protected-comparison.json`).

## Bounded browser groups

1. New/Edit author and category: four language fields, four bios, no tabs;
   pending targets raw/private, missing targets blank; manual Save/reload and
   target approval using real server actions.
2. Post selectors and readers: same selected IDs in four tabs; translated labels
   with non-EN selectors disabled; public detail/listing/related, localized author
   JSON-LD and private preview use the Post language, retaining Post snapshots.
3. Rename EN, clear ES name/category/bio, clear EN bio without losing independent
   targets; public refresh without Post republish, legacy routes/inbox, anonymous
   login redirect, mobile usable fields/actions and protected hashes.

Harness commands after sourcing safeenv:

- `QA_PREFLIGHT_ONLY=1 node /private/tmp/central-hill-blog-reference-locales-qa/independent/common.mjs`
- `node /private/tmp/central-hill-blog-reference-locales-qa/independent/group1.mjs`
- `node /private/tmp/central-hill-blog-reference-locales-qa/independent/group2.mjs`
- `node /private/tmp/central-hill-blog-reference-locales-qa/independent/group3.mjs`

Artifacts include per-group logs/results, before/after protected hashes, owned IDs
and unchanged Post/neutral snapshots. Root's integrated checks cover59focused
tests (54pure +5DB), typecheck and lint; old-client omitted translations, kernel
default-clear behavior and direct whitespace requests are covered there rather
than duplicated through a broader browser matrix.

No aesthetic/screenshot inspection loop is part of this functional QA; user
reviews appearance on localhost.

## Results and limits

| Group | Result | Verified behavior |
|---|---|---|
| 1 | PASS, exit0 | Author has4names/4bios and category4names without tabs; limits and raw pending/blank inputs; pending ES stays private; New and Edit Save/reload; all nonblank manual targets approved. |
| 2 | PASS, exit0 | Four Post tabs retain same selected author/category IDs, target selectors disabled with localized labels; four public details and JSON-LD resolve names/bios/category; listing category filter/card and related article links work; ES private preview resolves the same texts and is noindex. |
| 3 | PASS, exit0 | ENrename preserves custom targets; ESname/category clear independently for ENfallback while ESbio stays; ENbio clear preserves all targetbios; ESbio clear falls back to restored EN; old review redirects/inbox exclusion, real anonymous login redirect and mobile controls pass. |

Every group records zero pageerrors, identical42protected business hashes,
unchanged neutral author/category properties and unchanged complete Post/locale
rows (two posts, eight published locale units at rev7, no drafts). Public labels
changed immediately after reference Save without any Post Save or Publish.
Root's final comparison additionally confirms all42old-business hashes/counts
match its pre-seed/store baseline (`final-protected-comparison.json`).

New owned browser records retained: author32f7330c-3e42-477e-a053-84bea16ad0d5 and
category8e4e5605-dce4-4360-8cb6-9569bb94303d, plus e801 reference/post fixtures.
No new media was needed; existing d300 avatar/cover remained unchanged. Full IDs
and expected/final authored labels are in the private artifact directory.

The first group2 harness expected an author byline on ordinary Journal cards.
Existing JournalCard intentionally renders no author byline (FeaturedPost does).
The inapplicable assertion was removed; listing checks use the actual category
filter/card, while author/bio/JSON-LD are checked on detail and preview. Only the
unfinished read-only group2 resumed; approved group1 was carried forward. Initial
log retained as `group2-listing-expectation.log`. No product correction was needed.

Root integrated evidence reviewed:59/59tests0 (`tests-integrated.log`),
typecheck0, lint0/7pre-existing warnings and fullbuild0/136pages with2workers.
No migration exists for this task. QA performed no schema/remote writes, provider
submissions, email sends or runtime changes. No broad adversarial matrix or
repeat of approved functional groups was added. Appearance remains user-reviewed.
