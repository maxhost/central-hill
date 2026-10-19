# ADR0038 — Reusable form definitions and Resend

2026-10-18. Accepted for the user-authorized local form-builder arc.

The historical concept proposed a limited Leads-owned catalog. The user now requests
editable schemas (add/remove/order fields, layouts and steps), three templates, and
Resend. This supersedes that limited concept without changing existing public forms.

A new Forms slice owns JSON schemaVersion1 definitions, optimistic revisions and
staff-only test submissions. Leads keeps its four existing fixed contracts and inbox.
Contact, Newsletter and Owner estimate are starting blueprints, not fixed schemas.
No public routes, form placements, runtime API for anonymous traffic, releases,
public publishing, or replacement of Avantio/current forms in this arc. A future
placement arc must define immutable releases, eligibility, retention and public abuse
controls before exposing submissions. Test records are explicitly separate from leads.

Content translations reuse the kernel translation table (entity `form_definition`)
with stable block paths for field/step/option UUIDs. EN source + definition are one
SQL statement using sourceSnapshotCtes. A new generic targetSnapshotCtes kernel seam
composes complete target snapshots with a slice revision-guarded saved CTE, so a
stale editor cannot recreate removed fields or partially save a locale. The Forms
slice never mutates kernel tables directly. Missing/unapproved targets fall back to
EN; stale approved copy follows the current CMS policy and is marked in admin.

Resend uses native fetch behind core/email, no SDK/new dependency. EMAIL_PROVIDER
explicitly selects resend/console/disabled; defaults stay console in dev and disabled
in production. RESEND_API_KEY + EMAIL_FROM are required to use resend. Sender is
server-owned; each form has one validated recipient and an optional email reply-to
field. No editor-controlled credentials, URLs or sender identities. Resend API accepts
JSON at https://api.resend.com/emails with Bearer auth and reply_to. Acceptance is not
final delivery. No webhook/delivery guarantee in this arc. Console/skipped/failed are
distinct in staff test results, and test data persists before an attempted notification.
QA uses fake credentials + local intercept only; no real mail or production writes.

Official transport reference: [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email), verified2026-10-18. No SendGrid dependency/configuration is introduced.
