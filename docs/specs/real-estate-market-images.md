# Real Estate market images —2026-11-01

User requested a small row of two Pexels photos above Market Fundamentals,
matching the width of its three statistics, with both images editable in BO.

Same workspace/main and base `e5f0f44019f8cc9c4f60df1d86a998f23bce796d` as the
asset-card spec. Preserve all session edits. Bounded root-owned follow-up.
Writable: core `stat-bento.tsx` (ADR0049), Pages Real Estate schema/descriptor/
media validator/renderer, Real Estate adapter tests, EN/PT/ES/FR messages,
Pages README, this spec and visual handoff. No packages/DB/storage changes.

Contract: optional `feature.media` ReactNode before the title. Schema adds
optional `image_left_media_id`, `image_right_media_id`, `image_left_alt` and
`image_right_alt` to market.fundamentals. Declare two image-only references and
increase maxLocalMedia to13. Keep two equal columns with small cropped images;
fields are optional for old drafts/public content and alts remain translatable.

Verification: Node22 typecheck/lint/build and focused Real Estate model tests
cover both pickers, media collection, MIME/existence checks and legacy data.
No automated aesthetic QA or real upload/save tests; user reviews3071. No
database writes, migration, commit, push or deployment requested.

## Verification and delivery

Implemented in the current working tree with all preceding edits preserved.
Node22 `pnpm typecheck` exit0; `pnpm lint` exit0 (seven existing warnings);
`pnpm build` exit0,210 static pages generated. Focused command
`pnpm exec tsx --tsconfig scripts/tsconfig.json --test
src/slices/pages/tests/real-estate-editorial-adapter.test.ts` exit0,5 cases.
Tests verify13 total media references, both new editor paths, optional old
snapshots, preview media collection, image MIME/existence rejection, translatable
alts and existing asset-card identity behavior. Build/tests ran with approved
access outside sandbox. `git diff --check` exit0.

Images are110px tall on mobile and130px from681px upwards, with two equal
columns and a12px gap. Public media uses the existing resolved map and private
preview uses declared descriptor slots; sample photos remain remote Pexels URLs.
No real BO upload/save/reload or automatic visual QA claimed. No DB/storage
writes, migration, push or deployment.
