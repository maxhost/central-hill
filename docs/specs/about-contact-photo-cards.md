# About contact photo cards —2026-11-01

User requests the audience-card photo/overlay design for Let's Start a
Conversation, and explicitly requests per-card BO image selection.

Basea4633ed, current workspace/main. Preserve preceding uncommitted About label/
spacing changes (renderer, schema, README, visual handoff). Bounded root-owned
follow-up. Writable: About schema/descriptor/media validator/renderer, shared
PhotoFeatureGrid + ADR0052, About adapter tests and new focused photo-card tests,
Pages README, this spec and visual handoff. No DB/storage writes, migration,
packages, commit, push or deployment. No delegation for this bounded adaptation.

Reuse PhotoFeatureGrid with its existing About audience overlay (15%/55%/82%).
Add optional linkLabel to retain each contact card's visible action text; entire
card remains a same-tab localized semantic link. Add optional per-card image ID
to contact.cards, declare nested preview references and image MIME validation,
and raise local media capacity29→41 for up to12 cards. Existing snapshots remain
valid. Use existing illustrative audience photos as fallback by destination;
uploaded images take precedence. Stable identities retain images/links on reorder.
BO schema-generated picker is in each contact card, with the same photo guidance
as audience cards. No hidden field or new required content.

Functional verification: Node22 typecheck/lint/build and focused About media/
editor/identity tests, plus shared-card action-label rendering. No automatic
visual QA. No real BO save/upload against the remote database; report that limit.

## Delivered behavior and verification

Implemented in the current workspace alongside the preceding About label and
spacing changes. User subsequently requested a local commit before clearing
context; include this spec/ADR, updated AGENTS and visual handoff in that commit.

Contact cards now reuse the same PhotoFeatureGrid as audiences, including its
existing15%/55%/82% overlay. Optional linkLabel keeps the previous action copy
inside the single same-tab card link. Optional contact-card image references are
editable in both schema-generated BO paths, validated as existing image assets
and collected for local preview. Uploaded photos take precedence over existing
illustrative Pexels audience photos selected by semantic destination. Identity
and locale preparation retain each photo, title and destination after reorder.
Old content without the image field remains valid; maximum local media is41.

Node22 commands on the integrated working tree:

- `pnpm typecheck`: exit0.
- `pnpm lint`: exit0, seven pre-existing unrelated warnings.
- `pnpm exec tsx --tsconfig src/slices/pages/tests/tsconfig.json --test
  src/slices/pages/tests/about-contact-photo-cards.test.ts
  src/slices/pages/tests/about-editorial-adapter.test.ts
  src/slices/pages/tests/about-content.test.ts
  src/slices/pages/tests/about-presentation.test.ts`: exit0,14 cases.
  Covers optional legacy fields, independent BO media controls, preview IDs,
  image MIME/existence rejection,41 references at maximum list sizes, one
  same-tab card link/action label, and image/text/destination retention through
  reorder/language preparation. tsx required approved local socket access.
- `pnpm build`: exit0,210 static pages generated.
- `git diff --check`: exit0.

No automatic aesthetic QA, real BO save/reload, upload, database/storage write,
migration, push or deployment. Functional editor coverage is at model/descriptor
level; no browser persistence or independent QA approval is claimed. Appearance
is user-reviewed on localhost3071. No required implementation work remains.
