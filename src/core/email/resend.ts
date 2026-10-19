/** Dependency-free Resend transport (ADR0038). Server configuration is injected for testability. */
import type { EmailMessage, EmailProvider } from "./index";

export function createResendProvider(apiKey: string | undefined, from: string | undefined, transport: typeof fetch = fetch): EmailProvider {
  return {
    async send(message: EmailMessage) {
      if (!apiKey || !from) return { ok: false, error: "Resend requires RESEND_API_KEY and EMAIL_FROM" };
      try {
        const response = await transport("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: Array.isArray(message.to) ? message.to : [message.to], subject: message.subject, text: message.text, ...(message.html ? { html: message.html } : {}), ...(message.replyTo ? { reply_to: message.replyTo } : {}) }),
          signal: AbortSignal.timeout(10_000),
        });
        // Do not expose vendor response bodies (may contain message/recipient content).
        if (!response.ok) return { ok: false, error: `Resend rejected the request (${response.status})` };
        const data: unknown = await response.json();
        if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string" || !data.id) return { ok: false, error: "Resend returned no message id" };
        return { ok: true, id: data.id };
      } catch {
        return { ok: false, error: "Resend request failed or timed out" };
      }
    },
  };
}
