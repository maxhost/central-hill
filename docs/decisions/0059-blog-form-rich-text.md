# ADR0059 — Blog form and continuous rich text

2026-11-06. User explicitly corrects Blog authoring: a separate title input,
continuous body editor with formatting and inserted images, and separate cover/SEO
forms. Language tabs and complete locale draft/publication remain unchanged.

Add client-only Tiptap React/StarterKit/PM/Core, exact versions in lockfile. No
external service, raw HTML storage, contenteditable implementation invented in-house
or new core APIs. Preserve portable BodyBlock JSON and all eight existing node
types; optional inline runs encode bold/italic/safe href. Plain text fields remain
canonical and must equal concatenated runs. Lists keep text items and optional
aligned inline_items. Existing JSON is valid and round-trips without new fields.
Renderer uses React elements and validated links, never dangerouslySetInnerHTML.
No DB schema migration; existing Blog snapshots store the additive validated data.

The form replaces PageEditorShell for individual posts. Pages retain their visual
editor; locale persistence, permissions, scoped uploads and unsaved guards remain.
Toolbar supports headings2–4, lists, quotes, bold/italic/links, images and undo/redo.
Special legacy callouts, dividers and CTA nodes remain editable without conversion
loss. Unsupported editor nesting is prevented or explicitly rejected, never dropped.

Implementation/ownership: docs/specs/blog-form-editor-execution.md. Functional
verification includes codec/renderer tests, real synthetic Save/Publish roundtrip
and desktop/mobile browser checks. Only an explicitly authorized synthetic target is used; preserve
prior previews and fixtures. No production/GitHub/main merge.

Primary references: [React](https://tiptap.dev/docs/editor/getting-started/install/react),
[React node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react).
