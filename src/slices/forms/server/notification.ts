import type { EmailAttachment, EmailMessage } from "@core/email";
import type { FormBlueprint, FormValues } from "../types";
import { orderedFields } from "../layout";
/** Plain text only. Snapshots and email use the exact localized labels and consent notice. */
export function testNotification(name: string, recipient: string, definition: FormBlueprint, values: FormValues, submissionId: string, attachments: EmailAttachment[] = []): EmailMessage {
  const lines = orderedFields(definition).map(field => {
    const answer = values[field.id];
    const rendered = field.type === "select" ? field.options.find(option => option.id === answer)?.label ?? "" : typeof answer === "boolean" ? answer ? "Yes" : "No" : typeof answer === "object" && answer.kind === "file" ? `${answer.name} (${answer.type}, ${answer.size} bytes)` : answer ?? "";
    return `${field.label}${field.consent ? " [consent]" : ""}: ${rendered}`;
  });
  const replyTo = definition.replyToFieldId ? values[definition.replyToFieldId] : undefined;
  return { to: recipient, subject: `[Form test] ${name}`, text: [`Staff-only form test: ${name}`, `Submission: ${submissionId}`, "", ...lines].join("\n"), ...(typeof replyTo === "string" && replyTo ? { replyTo } : {}), ...(attachments.length ? { attachments } : {}) };
}
