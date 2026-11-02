# Blog hero background —2026-11-01

User requests a background photo like the other site heroes, editable in BO,
preserving headline, introduction and search copy independently in EN/ES/PT/FR.

Base f371a9a, main workspace. Preserve the preceding uncommitted Blog label
removal. Bounded root-owned adaptation; no agents needed. Writable files:
`src/slices/pages/{schemas/blog.ts,blog-content.ts,adapters/blog.ts,
admin/blog-media-validation.ts,admin/blog-save.ts,README.md}`;
`src/slices/blog/{ui/blog-listing.tsx,README.md}`; existing Pages tests
blog-media-validation, blog-editorial-adapter and blog-presentation; this spec
and the visual handoff. No kernel, package or migration changes.

Add optional hero.image_media_id with the existing image picker; include it in
media slots, validation and local preview (capacity2 including OG). Reuse Hero,
with the other pages' compact height, overlay and typography. Keep the Blog
search input in the hero, existing message fallbacks and catalogue behavior.
Use the existing Lisbon stock photo from the Guides hero until a photo is chosen;
uploaded image takes precedence. Background is decorative; eager loading/sizes
follow existing heroes. Private annotations select image/title/intro/search.

The existing locale draft/publish engine owns persistence/revalidation. Old
snapshots remain valid. Media is structural when preparing a new target from EN;
existing locale drafts remain independent and all four text fields remain [T].
No automatic aesthetic QA: user reviews3071. Functional checks: Node22 typecheck,
lint, focused Blog content/editor/media/adapter/presentation tests and build.
No real uploads, save/publish, DB/storage writes, migrations, push or deployment.
No commit requested. Report model-level verification separately from untested
browser persistence.

## Delivered and verified

Implemented in the workspace with the preceding Blog label removals preserved.
The shared Hero uses the existing compact layout, dark overlay, decorative
priority image and responsive width; PageHeadSearch sits beneath the introduction.
Private annotations address hero image, title, introduction and search. The image
picker is inferred from the optional schema media field in both BO paths. The
adapter, legacy save validation and preview descriptor all collect both images.
No new translation/message keys, DB schema or shared-kernel change.

Node22 verification on the working tree:

- `pnpm typecheck`: exit0.
- `pnpm lint`: exit0, seven existing unrelated warnings.
- `pnpm exec tsx --tsconfig src/slices/pages/tests/tsconfig.json --test
  src/slices/pages/tests/blog-content.test.ts
  src/slices/pages/tests/blog-editor.test.ts
  src/slices/pages/tests/blog-media-validation.test.ts
  src/slices/pages/tests/blog-editorial-adapter.test.ts
  src/slices/pages/tests/blog-presentation.test.ts`: exit0,19 cases.
  tsx first required local socket sandbox approval. First run17/19 exposed the
  old presentation harness missing BlogSharedAside/blogAsideCta; updated it to
  current composition and reran the five suites successfully. Assertions also
  reflect the preceding user-requested hidden labels.
- `pnpm build`: exit0,210 static pages generated with existing .env.local.
  Public reads only; no content write, upload or publish performed.
- `git diff --check`: exit0.

Coverage: legacy snapshots, image MIME/existence/UUID rejection at the correct
field, hero/OG independence, picker/text editability, EN→ES/PT/FR template/media
and text retention, both same-origin queued images before upload, unsupported
local video rejection, resolved photo and blob rendering with injected content,
four-locale message fallbacks, catalogue behavior and shared article copy.

No automatic visual QA/detector or browser save/reload/upload. Functional coverage
is model/composition-level, not a persistence or independent QA approval. User
reviews localhost3071. No DB/storage writes, migration, commit, push or deployment.

## User alignment follow-up

User first reports different lateral padding/alignment, then clarifies that Blog
title, introduction and search must remain horizontally centered as before the
photo change. Keep a full-width max1600px wrapper with the other heroes'40px
horizontal padding and60px top/40px bottom; center the copy, title/intro columns
and search action row. Aesthetic L0: no new tests/automatic QA; user validates
localhost3071. Earlier functional checks precede this class-only adjustment.
No DB writes, commit, push or deployment.
