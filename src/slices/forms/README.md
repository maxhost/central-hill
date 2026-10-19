# Forms

Forms owns reusable, editable form definitions and **staff-only test submissions**.
This arc does not change public page placement, existing Leads forms, the Leads inbox,
or the Avantio booking widget. Templates Contact, Newsletter and Owner estimate are
independent starting blueprints, with stable UUID fields/steps/options.

## Storage and contracts

`form_definition` stores a version1 EN blueprint, internal name, one recipient, revision,
and draft/archived state. `form_test_submission` retains the exact localized blueprint
(including select labels and consent notices), normalized values, staff identity, saved
revision, recipient and provider attempt outcome. Tests are separate from production leads.

`server/queries.ts`: `listForms`, `getFormEditor` (serializable data, target state/staleness).
`server/actions.ts`: `createForm`, `saveForm`, `saveFormLocale`, `archiveForm`, `testForm`.
Every query/action rechecks staff authorization. Saves use optimistic revision checks;
source/target snapshots and revision changes execute atomically through kernel i18n seams.
EN is authoritative. Target locale saves replace the complete target text snapshot;
blank or omitted values clear that target and fall back to EN. Approved stale translations
remain usable, matching current CMS policy, and are marked stale in the editor.

The shared schema validator caps40fields,6steps,30options per field and verifies IDs,
step references, reply-to field type, numeric bounds and all submitted fields across steps.
Recipient must be a valid email before save/test. Test actions only use persisted revision;
archived or stale submissions are rejected before capture and email. Capture precedes the
email attempt. Result distinguishes accepted by provider, logged locally, skipped, failed;
provider acceptance does not guarantee delivery. Resend is behind `core/email`; this slice
never handles credentials or contacts vendor endpoints. No HTML inputs or uploads.

Admin routes are dynamic/authenticated; no public ISR/SEO changes are introduced.
Public placement, immutable release policy, retention, anonymous submission protections
and integration with Leads remain a future arc.

## Verification

Node22: `pnpm exec tsx --test src/slices/forms/tests/forms.test.ts` exercises templates,
stable paths, localization fallback, definition constraints, full-step submitted values
and exact-label notifications. Integrated typecheck/lint/build/db:check and isolated
save/reload/browser QA are orchestrator-owned; see the active execution spec.
