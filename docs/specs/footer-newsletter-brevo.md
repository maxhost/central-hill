# Footer newsletter → Brevo HTML integration —2026-11-03

## Commit and deployment authorized

User explicitly requests committing/pushing this integration to
maxhost/central-hill with the supplied token, only for that Git operation;
saved55mais credentials must remain unchanged. Base and freshly fetched
origin/main1701436, no prior divergence. Include source, localized messages,
README/spec/handoff, the three supplied newsletter exports and the previously
added unit-test source (not executed). Preserve the two unrelated unused logo
files untracked. No local test/QA/subscribe command is authorized; Vercel's
deployment build/status is the publication check. No Neon migration or new
environment variable/API key is required. Do not claim real subscription,
provider list membership or confirmation-email delivery was verified.
Use git log -1 for the resulting commit and GitHub/Vercel status after push.

## User follow-up and current verification boundary

User explicitly stopped automatic checks/tests and will review the forms in
localhost without clicking Subscribe. Do not resume tests, browser QA or real
subscription submits without a new request. The earlier test command initially
failed because tsx's socket was sandbox-blocked; its escalated retry was
interrupted. No passing-test claim is made for this integration. Existing added
test code is retained, not executed. Earlier verification proposals below are
historical and superseded by this instruction.

User subsequently authorizes the same Brevo connection for the Blog newsletter
band, explicitly preserving its UI. Add Settings' BrevoNewsletterForm using the
exact same core form-card primitives and existing Leads label/placeholder/consent/
button copy, dark tone,480px host width and spacing. Reuse the footer's private
transport helper and localized provider response messages. Export through the
Settings contract; Blog's shared NewsletterSignup uses it for listing and posts.
No Leads submissions/Neon writes for this band. The reusable Leads component
itself is unchanged. Disabled submit guard plus existing inert wrapper preserve
the private page preview. Pending requests abort/ignore late results on unmount,
duplicates are blocked, timeout remains20s. Root owns the new form, Settings
contract, shared Blog composer, affected READMEs and this spec/handoff.
No tests, automatic QA, actual subscriber, commit, push or deployment.

User authorizes applying docs/newsletter/HTML.txt to the existing footer modal,
retaining the initial inline email, prefilled/editable modal email and provider
success/error handling. Base main1701436, no tracked changes; pre-existing
untracked docs/newsletter/ (three supplied exports) and two unused logos stay
preserved. This is functional integration, not aesthetic-only work.

Bounded root-owned work: Settings FooterNewsletter, new private pure Brevo
transport helper and focused tests, SiteFooter labels, messages/en/es/pt/fr,
Settings README, this spec and visual handoff. The supplied HTML.txt is a read-only
reference. No agents needed for this single component/transport boundary. No
kernel, package, database, migration, Leads/Forms, Blog band or Resend changes.

Adapt the supplied HTML form into controlled React markup within the existing
modal. Preserve its fixed public action URL and EMAIL, OPT_IN=1,
email_address_check and locale fields. Match the provider embed's Ajax transport
(POST FormData to action?isAjax=1), not the Simple HTML export, a remote iframe or
the privileged Brevo API. No API key needed. The public runtime main.js was
read-only inspected: it uses XMLHttpRequest/FormData and response.success,
optionally redirect/successPage/message. Our React adapter must treat only an
explicit boolean success as acceptance and render localized text, not provider
HTML or navigation. Provider-controlled list/confirmation settings remain in
Brevo; acceptance does not assert double-opt-in has completed.

Use one initially unchecked required opt-in matching the provided newsletter/
privacy statement (replace the old mock's unrelated terms/optional-marketing
controls). Keep footer input behavior, editability, localized EN/ES/PT/FR labels,
Escape/backdrop/close, body scroll lock and focus handling. Disable pending
submits, show localized error on rejection/network/timeout/unexpected response,
allow retry, abort and ignore stale work on close/unmount, reset on reopen.
Only submit after explicit final confirmation, never when opening the modal.

No automatic visual QA. Functional checks are authorized: Node22 typecheck/lint,
focused pure tests, build, and one bounded desktop/mobile browser sequence with
all Brevo POSTs intercepted (no actual subscribers, emails, DB/storage writes).
Cover prefill/edit/send, unchecked consent blocks submit, pending duplicate
prevention, success/error/retry/timeout/close-reopen, payload and four locales.
Do not claim a real Brevo list write or double-opt-in email was verified.
No commit/push/deployment requested in this task.

Reference: https://help.brevo.com/hc/en-us/articles/208771869-Create-a-sign-up-form-in-Brevo
(official embed distinctions verified2026-11-03). Public embed script inspected:
https://sibforms.com/forms/end-form/build/main.js (read-only copy in /private/tmp).
