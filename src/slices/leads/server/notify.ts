import { leadNotifyTo, sendEmail } from "@core/email";
import type { LeadSubmission } from "../validation";
import { buildLeadNotification } from "./notify-message";

/**
 * Best-effort staff notification for a new lead (ADR 0011/0016). Returns silently
 * when no recipient is configured (`LEAD_NOTIFY_TO` unset); `sendEmail` never
 * throws, so a mail failure can never fail the lead persist in `actions.ts`. The
 * message itself is built by the pure `buildLeadNotification` (unit tested).
 */
export async function notifyStaff(submission: LeadSubmission, leadId: string): Promise<void> {
  const to = leadNotifyTo();
  if (!to) return;
  await sendEmail(buildLeadNotification(submission, leadId, to));
}
