import type { EmailMessage } from "@core/email";
import type { LeadSubmission } from "../validation";
import { flattenFields } from "./fields";

/**
 * Pure builder for the staff lead-notification email (ADR 0011/0016). No DB, no IO,
 * and only a *type* import from `@core/email` (erased), so it is unit-testable
 * without pulling the `server-only` email runtime. The sender lives in `notify.ts`.
 */

const KIND_LABEL: Record<LeadSubmission["kind"], string> = {
  earnings_estimate: "Earnings estimate",
  deal_enquiry: "Deal enquiry",
  contact: "Contact",
  newsletter: "Newsletter signup",
};

/** A reply-to address if the submission carries the lead's own email. */
function replyTo(submission: LeadSubmission): string | undefined {
  const fields = submission.fields as { email?: string };
  return typeof fields.email === "string" ? fields.email : undefined;
}

/**
 * Build the plain-text staff notification for a persisted lead. `to` is the staff
 * inbox; `leadId` ties the mail back to the backoffice record.
 */
export function buildLeadNotification(
  submission: LeadSubmission,
  leadId: string,
  to: string,
): EmailMessage {
  const lines: string[] = [
    `New ${KIND_LABEL[submission.kind]} lead`,
    "",
    `Lead:    ${leadId}`,
    `Kind:    ${submission.kind}`,
    `Locale:  ${submission.locale}`,
    `Source:  ${submission.source_page}`,
    `Consent: ${submission.marketing_consent ? "yes" : "no"} — "${submission.consent_text}"`,
    "",
  ];
  for (const { key, value } of flattenFields(submission)) {
    lines.push(`${key}: ${value}`);
  }

  return {
    to,
    subject: `[Lead] ${KIND_LABEL[submission.kind]} — ${submission.source_page}`,
    text: lines.join("\n"),
    replyTo: replyTo(submission),
  };
}
