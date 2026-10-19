import "server-only";
import { env } from "@core/env";
import { createResendProvider } from "./resend";

/** Transactional mail kernel. Explicit EMAIL_PROVIDER=resend selects Resend;
 * otherwise development logs locally and production disables delivery (ADR0038).
 * Provider acceptance is not final delivery. Slices never contact a vendor directly.
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
  const selection = env.EMAIL_PROVIDER ?? (process.env.NODE_ENV === "production" ? "disabled" : "console");
  cached = selection === "resend" ? createResendProvider(env.RESEND_API_KEY, env.EMAIL_FROM)
    : selection === "console" ? consoleProvider : noopProvider;
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
