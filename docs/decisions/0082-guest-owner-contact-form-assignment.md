# ADR0082 — Guest owner contact Form assignment

Guest's Closing dual CTA owns optional nullable dual_cta.owner.contact.form_id in the
existing JSON envelope. Its publishedEN snapshot is the single reference for all4locales;
ENdraftSave stays private and ENPublish changes selection without publishing targetcopy.
The ownerContactDialog keeps its title/intro/trigger and consumes the existing children
seam for the selected PublicContactForm. Header/About selections remain independent.
Absence/null/invalid reference preserves the original guests-dual-cta ContactForm.
No schema migration or backfill. Manual invalidrefs do not discard other authoredcopy.

Explicit authenticated Guest preview override uses ENworking selection on every languagetab;
Form saveddefinition is read freshly and renderedinert. Public DTO excludesrecipient/private
tests/pendingtranslations. Reuse server-only Pages/Forms composition contracts of ADR0081.

Guest captures contact leads source_page=guests-dual-cta through a dedicated publicaction,
shared validated pipeline and origin-bound idempotency; existing About/header hashes and
replays retain compatibility. PublishedID+published_at identity is independent of draft
revision. Existingshared ratecounters/honeypot/filelimits apply across3placements, not per
newlocation. Files attachonly, bytes never stored in Leads or publicmedia.

Guest Save/Publish joins HEADER_CONTACT_LOCK sharedwith About/Settings/Forms/capture under
separate lock/mutation statements READCOMMITTED and existingeditorial revision/rowlocks.
Guards validate current assignment/formrevision during capture and currentdraft/published
usage during Archive; ENtargetcopies create no independent use. UUID text comparisons are
case-insensitive without unsafe casting of invalidmanualJSON.

GuestENPublish invalidates4/guests paths+commonpublishedtag. FormsSave/Approve invalidates
allusedplacements while preserving separate About/header invalidations. Resend remains
unconfigured/console; localproof never asserts realmail or inboxattachmentreceipt.

ContactDialog keeps the existing children API and width decision. When its private
editorPreviewId is provided, only the form body is wrapped inert; dialog preview
open/close controls remain usable. Public callers omit this flag and retain markup.
