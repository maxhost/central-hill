import type { EmailMessage } from "@core/email";
import type { FormBlueprint, FormValues } from "../types";
/** Plain text only. Snapshots and email use the exact localized labels and consent notice. */
export function testNotification(name: string, recipient: string, definition: FormBlueprint, values: FormValues, submissionId: string): EmailMessage {
  const lines = definition.fields.map(field => {
    const answer = values[field.id];
    const rendered = field.type === "select" ? field.options.find(option => option.id === answer)?.label ?? "" : typeof answer === "boolean" ? answer ? "Yes" : "No" : answer ?? "";
    return `${field.label}${field.consent ? " [consent]" : ""}: ${rendered}`;
  });
  const replyTo = definition.replyToFieldId ? values[definition.replyToFieldId] : undefined;
  return { to: recipient, subject: `[Form test] ${name}`, text: [`Staff-only form test: ${name}`, `Submission: ${submissionId}`, "", ...lines].join("\n"), ...(typeof replyTo === "string" && replyTo ? { replyTo } : {}) };
}
