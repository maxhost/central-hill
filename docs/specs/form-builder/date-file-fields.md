# Forms Date and File fields

User request 2026-11-11: add Date and File to the existing Forms editor. PDF/images,
5 MB per attachment, sent in notification email. Public placement is outside scope.

Base: 3aafcdfb28411324cdc16843e73660bf5b5b4343, main. Pre-existing untracked original
logo PNG and public/propertylocalesqa are preserved. No tracked changes at preflight.
Current localhost3071 uses propertylocalesqa through the existing guarded fetch preload
/private/tmp/central-hill-localhost-20261111/preload.cjs and proxy4558. Credentials stay
in ignored environment files. Product source is integrated locally for this preview;
no push/deploy, remote database, schema/migrations or user form content writes.

## Ownership and contracts

Root: types.ts, file-policy.ts, core/email/index.ts, core/email/resend.ts,
core/email/tests/resend.test.ts, next.config.ts, ADR0078, this spec, Forms README and
contract.ts. Shared contracts are committed before isolated consumers.

Implementer A: forms/validation.ts, forms/server/actions.ts, forms/server/notification.ts,
new forms/server/attachments.ts, forms/tests/forms.test.ts and new forms/tests/attachments.test.ts.
Worktree /private/tmp/central-hill-form-date-file-a, branch forms/date-file-a.

Implementer B: forms/admin/form-editor.tsx, forms/ui/form-runtime.tsx, forms/messages/*.json,
new forms/tests/runtime-date-file.test.tsx if useful. Worktree
/private/tmp/central-hill-form-date-file-b, branch forms/date-file-b.

QA: independent read-only source review and focused verification of the integrated
candidate, desktop/mobile browser checks. No writes to the user's existing form.

File policy and core EmailAttachment are shared root-owned contracts. Test action becomes
testForm(input: TestFormInput, files?: FormData). Runtime callback receives
(values: FormInputValues, files: FormData). Input JSON remains strings/booleans;
verified FormFileValue {kind:'file',name,type,size} is only constructed server-side.
validateValues accepts an optional third verified file metadata map. Existing callers
without files keep working. Filenames in answers and email are sanitized server-side.

## Acceptance and verification

- Date/File appear in all four admin languages and preview, persist through existing
  explicit Save, maintain stable field IDs/steps and existing localization behavior.
- Real dates, leap days, optional/required values are validated on the server.
- Single file per field, actual PDF/image bytes, exact 5 MiB accepted; oversize, empty,
  wrong/spoofed types, duplicate/unknown/non-file form data and aggregate overflow rejected.
- Valid attachments arrive in Resend payload with exact bytes and readable filenames;
  answer snapshots contain metadata only. No send/insert before full validation.
- Returning through wizard steps preserves files; cancel clears them; invalid selection
  cannot retain a previous attachment. Upload errors and file restrictions are accessible.
- Existing templates, Leads/public forms, translations and email callers stay compatible.

Commands: Node22 pnpm exec tsx --test src/slices/forms/tests/forms.test.ts
src/slices/forms/tests/attachments.test.ts src/core/email/tests/resend.test.ts;
pnpm typecheck; pnpm lint; build in a separate temporary runtime directory to preserve
the active .next cache. Browser checks use isolated harness/DB only; no real emails.
Any unavailable persistence environment is reported without claiming it passed.

## Progress

Audit complete. Root contracts ready; implementation and independent QA pending.
