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

QA: independent source review and focused verification of the integrated candidate,
desktop/mobile browser checks. Only a new synthetic form in the existing isolated
translationsretirementqa DB; no writes to the user's existing form/database. Uses
normal login with the existing synthetic Admin and intercepted fake Resend. No
credentials/session tokens are printed or extracted. QA artifacts stay under
/private/tmp/central-hill-form-date-file-qa.

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

Root contracts e0f92b4, email/config569d8bc; writer A8001e0e and B b342abb+a1d8c16
integrated into executable8c3c121. Root Node22.23.3 verification:25/25 focused tests,
typecheck0, lint0 (seven existing warnings), diff-check0. The tsx CLI cannot open
its IPC pipe in this sandbox; equivalent node --import tsx --test completed normally.
Impeccable detector on both changed UI files returned []/exit0.

Build uses the separate detached runtime /private/tmp/central-hill-form-date-file-runtime,
same product8c3c121, guarded synthetic env and CIRCLE_NODE_TOTAL=3 (two workers).
First attempt could not resolve an external node_modules symlink under Turbopack;
the task-owned symlink was preserved as node_modules.shared-link and dependencies
cloned locally. The original logo was copied read-only for the existing imports.
Second build passed exit0:107/107 static pages with two workers. Main's cache/env/media
symlink remain intact. Existing localhost email mode is console with no Resend key
or sender configured; real email delivery is not claimed.

Independent QA approved exact8c3c121:14 bounded browser checks, zero pageerrors,
desktop1440/mobile390 runtime and editor screenshots inspected. Real Save/reload
retains Date/File and two wizard steps. Required inputs, oversize/unsupported files,
and spoofed PDF bytes reject without capture/email. Wizard Back retains the file;
Cancel/Test again clears it. Optional File remains empty without a phantom attachment.
A 5,242,880-byte PDF plus PNG arrived byte-for-byte in the intercepted fake Resend
payload; DB snapshots contain only verified filename/type/size. Root independently
recomputed both attachment SHA256s and matched the browser evidence. Four-locale
labels/control rendering also pass source/SSR coverage; browser interaction was EN.
No product fixes during QA; one pre-Save harness selector was corrected and resumed
the same synthetic form. Report: /private/tmp/central-hill-form-date-file-qa/independent-qa.md,
browser-report.json, db-final.json, mail-capture.jsonl and screenshots. Own retained
QA form e8d78926-10a9-40b6-918c-28c202436518/revision2 and two test submissions are
only in translationsretirementqa; the user's existing form was not saved or changed.

Final main localhost3071 runs Node22 with the existing propertylocalesqa preload,
PID69158/session76614, cwd independently verified. Read-only SQL identity and SELECT1
passed; login200 and the supplied form URL anonymous->login307. Evidence main-open.json
and main-restart.log under the task QA directory. Product source remains identical
to approved8c3c121; final documentation-only commit resolves through git log -1.
Task-owned isolated QA3081 is stopped after evidence completion; all fixtures,
worktrees, build and artifacts are retained. No migration/schema, remote DB, push,
deploy, original logo or original public media changes.
