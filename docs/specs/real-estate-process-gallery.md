# Real Estate process gallery — 2026-11-01

User requests the Owners “Your growth path” photo-card format for Real Estate's
process section, including editable text and images in backoffice.

Bounded root-owned change in the current workspace/main, base
`e5f0f44019f8cc9c4f60df1d86a998f23bce796d`. Preserve all existing working changes.
Writable: Real Estate renderer, schema, descriptor, media validator, adapter
tests, EN/PT/ES/FR editor guidance, Pages README, this spec and visual handoff.
No shared-kernel changes, new dependencies, database/storage writes, commit,
push or deployment. Existing StepGallery is the visual authority; no automatic
aesthetic QA. User reviews localhost3071.

Contract: process steps gain optional image_media_id and translatable image_alt.
Existing title/description and stable identities remain; lists still allow3–8
steps. Declare nested image slots and references; local preview supports21 media
items (previous13 plus maximum8 steps). Missing images use illustrative stock
photos with legacy identity preserving their mapping after reorder. Keep the
existing enquiry CTA below the gallery. Existing saved content needs no migration.

Acceptance: same StepGallery as Owners, warm background,70px section padding;
heading/subheading, numbered photos and current copy; image/alt/text editing
participate in the existing selected-language draft/publish and live-preview
mechanisms. Verify model field exposure, media collection/type rejection,
legacy compatibility, reorder and translated-alt identity using focused tests.
Run Node22 typecheck/lint/build for the functional editor extension. Do not
perform actual BO save/upload or browser visual QA against the remote database.

## Progress

Implemented with the existing shared StepGallery (unchanged). Its responsive
grid is5/2/1 columns, and preserves3–8 step support by wrapping extra cards.
Original Real Estate copy and CTA remain. Missing images use the same temporary
Pexels photos as Owners, mapped by legacy identity. Uploaded photos have priority;
alt resolution is authored alt, media alt, then the step title.

BO fields are generated from the schema in the current process group. Added the
nested descriptor image slot and reference collector/validator, and updated the
editor's process guidance in EN/PT/ES/FR. Existing public recursive media reads
and selected-locale preview/draft/publish machinery consume the new fields.

## Verification and limits

- Node22 `pnpm typecheck`: exit0.
- Node22 `pnpm lint`: exit0, seven existing unrelated warnings.
- Node22 `pnpm exec tsx --tsconfig scripts/tsconfig.json --test
  src/slices/pages/tests/real-estate-editorial-adapter.test.ts`: exit0,7 cases.
  Verifies all step editor fields, legacy snapshots,21 maximum media references,
  image MIME/existence rejection, preview media IDs and translated alt/text/image
  identity after reorder. Initial run caught a missing optional schema wrapper;
  corrected before the final passing checks.
- Node22 `pnpm build`: exit0,210 static pages generated.
- `git diff --check`: exit0.

Verification applies to the current working tree, with preceding session changes
preserved. No automated aesthetic QA, real upload/save/reload, database/storage
writes, migration, commit, push or deployment. The user reviews localhost3071;
editor integration is verified at the model/descriptor level, without claiming
browser persistence QA against the remote database.

At delivery3071 had no listening process. Started this workspace's Node22
`pnpm dev --port3071` (actual CLI uses `--port 3071`), tool session19196;
Next reported ready. No other preview/process was stopped or modified.
