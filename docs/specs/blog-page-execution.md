# Blog page editor — authorized execution

2026-10-18. User authorized implementation of revised `blog-cms-plan.md`.
Baseline code d4e13c9/documentation1c48555; approved planning captured0418662,
tag `savepoint/pre-blog-page-editor-2026-10-18`. Original About checkout retains
its documentation-only working changes; they were copied deliberately, no reset.
No main merge, push, deployment or production writes. Previews3059–3062 preserved.

Integration `/private/tmp/central-hill-blog-page-integration` branch
`blog-page/integration`. A `/private/tmp/central-hill-blog-page-admin` branch
`blog-page/admin`; B `/private/tmp/central-hill-blog-page-public` branch
`blog-page/public`. Branch from contracts commit recorded below before delegation.
Each verifies pwd/branch/HEAD/status. node_modules symlinks are ignored and point
to existing installed dependencies; no env/production credentials copied.

## Contracts settled before consumers

- `BlogContent` keeps required existing `post_aside`; new optional groups `seo`,
  `hero`, `featured`, `journal`, `newsletter`, all leaf overrides [T]. Names and
  limits in `schemas/blog.ts`. No migration or kernel edits.
- `getBlogPage(locale): Promise<BlogPage>` never null, resolved overrides and OG.
  `getBlogAsideCta` remains compatible. Tag `page:blog`; page publish already
  invalidates Blog layout tree in four locales. `buildBlogMetadata` consumes SEO/OG
  with four-locale messages and Settings default OG via public contracts.
- Pure `blog-content.ts`: `BLOG_FALLBACK_KEYS` maps leaf paths to `blog` message
  keys. Empty overrides never materialize on Save; admin placeholders show EN.
  `blogSourceFields` enumerates authored nonblank `block:<path>` source values.
  `blogLocalizedContent` prevents stale targets reviving cleared source values.
- Save uses existing kernel sourceSnapshotCtes to compose a Pages-owned saved CTE:
  page+source sync atomically, surviving targets unchanged, cleared fields removed.
  No optimistic-revision expansion or adversarial-matrix requirement.
- `revalidatePageTranslation(UUID)` resolves page key and invokes Pages invalidation;
  Translation calls it after every target write/state change. No foreign table imports.
- Admin model may gain pageId and inheritedValues; orchestrator owns app-shell
  prop pass after A reports final shape. Placeholder fallback values must never
  become persisted source unless user enters them. Blank→localized default help.
- Message keys available: `pages.admin.blogSourceNote`, `blogSourceInvalid`,
  `blogInheritedHint`; `admin.layout.cards.blogHero/blogFeatured/blogJournal/
  blogNewsletter/blogAside`, `notes.blogNewsletter/blogCatalogue/blogAside`,
  `links.blogPosts`; labels `search_placeholder/search_label`; `blog.metaTitle/metaDescription`.

## Exact writers

Orchestrator: `AGENTS.md`; docs/specs/blog-* and future handoff-blog-page.md;
`docs/data-model.md`; `src/slices/pages/{README.md,contract.ts,blog-content.ts,
schemas/blog.ts,server/queries.ts,server/metadata.ts,server/translation-revalidation.ts}`;
`src/slices/blog/README.md`; `src/slices/translation/admin/actions.ts`;
`messages/{en,pt,es,fr}.json`; `src/app/[locale]/blog/page.tsx`;
`src/app/(admin)/admin/(panel)/pages/[key]/page.tsx`;
new `src/slices/pages/tests/blog-content.test.ts`; existing `tests/pages-admin.test.ts`
obsolete no-layout Blog expectation updated by root (Blog now has a layout);
`tests/pages.test.ts` existing aside-path assertion scoped to aside as new Blog fields are translatable. Page translation invalidation
is verified through actual approval/reset in the isolated browser QA.

A only: `src/slices/pages/admin/{queries.ts,actions.ts,layout.ts,ui/page-editor.tsx,
ui/schema-fields.tsx}`; new `admin/blog-defaults.ts`, `admin/blog-save.ts`,
`admin/blog-media-validation.ts`, `tests/blog-editor.test.ts`, `tests/blog-media-validation.test.ts`.

B only: `src/slices/blog/ui/blog-listing.tsx`, `src/slices/blog/ui/blog-post.tsx`;
new `src/slices/pages/tests/blog-presentation.test.ts`.
Use Pages contract and per-field orMessage; no visual redesign or search behavior.

QA only: `docs/specs/blog-page-qa.md` and own temporary scripts/artifacts. No code fixes.
Agents request scope changes before editing any other file; only orchestrator integrates.

## Acceptance/checks and environment

Acceptance is exactly revised plan: four screenshot text sections plus listing
SEO/OG; preserve existing aside. Editor source EN with Translation ES/PT/FR. Save,
reload, second Save, real OG upload, approved ES change visible without rebuild;
PT/FR fallback smoke, canonical/hreflang and desktop1440/mobile390. Two synthetic
posts, category, author suffice. No article-editor/search follow-up work.

New isolated environment planned `blogpageqa`, preview3063, DB5588, proxy4488,
S3rver9063, own Docker network/bucket and synthetic staff. Verify ports free and
record actual processes/environment before writes. No use of existing preview DBs.

Node22/pnpm. Required integrated checks: `pnpm typecheck`, `pnpm lint`,
`pnpm exec tsx --test src/slices/pages/tests/blog-content.test.ts src/slices/pages/tests/blog-editor.test.ts src/slices/pages/tests/blog-media-validation.test.ts src/slices/pages/tests/blog-presentation.test.ts src/slices/blog/tests/blog.test.ts src/slices/blog/tests/blog-admin.test.ts src/slices/blog/tests/headings.test.ts`
plus existing Pages/admin/Translation consumer tests as identified during integration;
`pnpm build` using only isolated env in own integration/runtime. Manual boundaries,
four-locale keys and detector on changed UI. Record actual commands/exits/commit.
db:check only for migration changes (none planned); placeholders do not count.

## Progress

- Planning savepoint0418662 recorded. Contract implementation and environment preparation underway.
- Contracts da26d36 passed typecheck (exit0). A and B branched from da26d36.
- DB/proxy containers central-hill-blog-page-db/proxy created on network
  central-hill-blog-page-qa, DB5588/proxy4488. Existing migrations0000..0021 applied
  to new blogpageqa only, exit0. Initial pg_isready was early (exit2); psql then
  connected and completed migrations. S3rver9063 PID64131/session72582.
- Synthetic env/preload/media fixtures in /private/tmp/central-hill-blog-page-qa;
  no existing preview env copied except publicly fictitious local template values.

- A9c6f887 and B71659a2 handed off. A typecheck/lint/focused5 passed; old
  Pages layout assertion updated by root. B typecheck/focused lint/presentation5 passed.
- New fixture DB identity blogpageqa/blogpageqa verified; two posts, one category,
  one author, one photo and synthetic staff created. Proxy needs its own local
  neon_control_plane.endpoints registry, created in Blog DB only.
