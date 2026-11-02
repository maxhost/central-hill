# Real Estate asset cards — local implementation2026-11-01

User authorizes a complete replacement of the Asset Management section according
to the supplied six-card reference, including editable background images, icons
and text in the existing Real Estate BO page editor.

Base: `e5f0f44019f8cc9c4f60df1d86a998f23bce796d`, current branch `main`, workspace
`/Users/maxi/Documents/claude-workspace/central-hill`. Preserve all preceding
uncommitted session work recorded in the visual-refinements handoff.

Bounded single-slice change, root-owned implementation. Writable files:
`src/slices/pages/schemas/real-estate.ts`, `real-estate-content.ts`,
`admin/real-estate-media-validation.ts`, `ui/real-estate-page.tsx`, new
`ui/components/asset-type-cards.tsx`, existing tests for Real Estate adapter /
page admin, new asset-card focused tests if needed, Pages README, and this spec.
No shared kernel, package, migration, database or production changes.

Design: retain section heading/intro and existing CTA, replace the split image /
text showcase with six equal cards,3/2/1 columns at desktop/tablet/mobile. Each
card has its own cover image, dark overlay, brand-tinted icon, title and body
anchored toward the bottom. Keep existing content and70px section padding.
Sample photos are temporary fallbacks; no storage uploads/writes are implied.

Model: keep `asset_management.benefits` and its stable item IDs. Add optional
image reference and optional alt copy per item, with no new required fields.
Hide the obsolete single side-image input but preserve its legacy value and
validation. Declare six nested image slots and resolve them in public/private
media snapshots. Add image MIME validation and increase local-media capacity.
Icon/text fields continue through the existing schema-derived editor. Locale
draft/publish, text identity, SEO and ISR contracts remain unchanged.

Acceptance: all six cards render, each image/icon/title/body editable per item;
new media IDs are collected/validated and included in preview/public media;
existing rows/drafts with no new fields still validate; reorder keeps image and
translated text attached to its item; old single-image field hidden/preserved.
Existing header and all other page sections retain their current state.

Verification: Node22 typecheck/lint, focused schema/descriptor/media/identity
tests and full local build. No automatic aesthetic QA (L0); user reviews3071.
No DB writes/uploads or persistence/browser-save tests against remote Neon.
No push/deploy. Functional checks and limitations will be recorded below.

## Delivery and verification

Implemented on the existing working tree; no commit or external action requested.
Changed paths match the write set above: schema/descriptor/media validator,
page composition, new AssetTypeCards component, two existing test files, Pages
README, this spec and the session visual handoff. Prior session work remains.

Node22 checks:

- `pnpm typecheck`: exit0.
- `pnpm lint`: exit0, seven existing warnings outside this task.
- `pnpm build`: exit0, all210 static pages generated; approved execution outside
  sandbox for Turbopack's internal port.
- `pnpm exec tsx --tsconfig scripts/tsconfig.json --test
  --test-name-pattern='Real Estate|Asset.cards|Asset cards|realEstateSchema|real estate S|real estate layout \+'
  src/slices/pages/tests/real-estate-editorial-adapter.test.ts
  src/slices/pages/tests/pages-admin.test.ts src/slices/pages/tests/pages.test.ts`:
  exit0,18 scoped tests. Includes new media fields,11 refs, hidden legacy slot,
  editor field visibility, MIME/existence validation, preview media IDs and
  backwards compatibility. The additional asset reorder/alt/language preparation
  case passed in the initial complete run (its singular name was not matched by
  the final filter).
- Initial wider run:138/144 passed,6 failures. One new test assertion described
  a media schema without its field key; corrected to walk the actual editor
  descriptor and it now passes. Five remaining legacy assertions are outside
  this feature: four old editor-layout expectations include an extra Other card
  from private metadata, and one Owners assertion expects the retired closing
  eyebrow's old hint. No unrelated product changes were made to satisfy them.
- `git diff --check`: exit0.

No automatic aesthetic QA; user reviews the new section on3071. No database
writes, storage uploads or real BO save/reload checks performed. Image/text
editing and media round-trips are covered at the schema/descriptor level, not
claimed as browser persistence QA. Public resolution recursively includes the
new nested media references; private snapshots use the tested descriptor slots.
SEO and locale publish/ISR machinery remain unchanged. No migration/push/deploy.
