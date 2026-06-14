import "server-only";
import { env } from "@core/env";

/**
 * Transactional email — kernel seam (ADR 0011 "notify staff by email"; ADR 0016
 * for the implementation shape). Slices never talk to a vendor SDK directly; they
 * import {@link sendEmail} (or the typed message + provider interface) from here so
 * the provider can be swapped behind one interface (mirrors `core/i18n/translate`).
 *
 * Server-only: this is never imported by statically rendered public pages.
 *
 * Provider selection (intentionally dependency-free for now):
 *  - **dev** → `consoleProvider`: logs the message so local lead notifications are
 *    visible without any vendor credentials.
 *  - **prod without a vendor wired** → `noopProvider`: silently no-ops. Leads are
 *    still durably captured in Neon + the backoffice inbox (S12); the email is a
 *    best-effort nicety, so a missing provider must never lose data.
 *
 * Wiring a real transactional vendor (Resend/Postmark/SES — EU region per ADR 0015)
 * is a follow-up: add the dep + an `EmailProvider` impl behind a new ADR, then
 * select it here when `EMAIL_API_KEY`/`EMAIL_FROM` are present. No call site changes.
 */

/** A transactional message. `text` is required; `html` is an optional richer body. */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  /** Address replies should go to (e.g. the lead's own email). */
  replyTo?: string;
}

export interface EmailResult {
  ok: boolean;
  /** Provider message id when sent. */
  id?: string;
  /** True when no provider was configured and the send was intentionally skipped. */
  skipped?: boolean;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
}

const recipients = (to: string | string[]) => (Array.isArray(to) ? to.join(", ") : to);

const consoleProvider: EmailProvider = {
  async send(message) {
    console.info(
      `[email] to=${recipients(message.to)} subject=${JSON.stringify(message.subject)}\n${message.text}`,
    );
    return { ok: true, id: "console" };
  },
};

const noopProvider: EmailProvider = {
  async send() {
    return { ok: true, skipped: true };
  },
};

let cached: EmailProvider | null = null;

/** The active provider (memoized). See module docs for the selection rules. */
export function emailProvider(): EmailProvider {
  if (cached) return cached;
  cached = process.env.NODE_ENV === "production" ? noopProvider : consoleProvider;
  return cached;
}

/**
 * Send a transactional email. Never throws — returns `{ ok: false, error }` so
 * callers (e.g. lead notifications) can treat delivery as best-effort and never
 * fail the underlying operation on a mail error.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  try {
    return await emailProvider().send(message);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "email send failed" };
  }
}

/** Configured sender address (`EMAIL_FROM`), or null when unset. */
export const emailFrom = (): string | null => env.EMAIL_FROM ?? null;

/** Where lead notifications are sent (`LEAD_NOTIFY_TO`), or null when unset. */
export const leadNotifyTo = (): string | null => env.LEAD_NOTIFY_TO ?? null;
