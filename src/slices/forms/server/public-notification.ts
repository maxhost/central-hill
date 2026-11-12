import { createHash } from "node:crypto";
import type { EmailAttachment, EmailMessage } from "@core/email";
import type { Locale } from "@core/db/columns";
import type { ContactFormSnapshot } from "@slices/leads/contract";
import { orderedFields } from "../layout";
import type { FormBlueprint, FormRecord, FormValues } from "../types";

/** Exact localized labels survive future edits. Byte hashes distinguish files
 * sharing a filename, MIME and length; attachment bytes never enter persistence. */
export function buildContactSnapshot(form: Pick<FormRecord, "id" | "name" | "revision">, definition: FormBlueprint, values: FormValues, locale: Locale, fingerprint: string, attachments: EmailAttachment[] = [], placement?: { sourcePage: "about-contact" | "guests-dual-cta" | "real-estate-enquiry"; assignmentIdentity: string } | { sourcePage: `service:${string}`; serviceId: string; assignmentIdentity: string }): ContactFormSnapshot {
  const fields = orderedFields(definition).map(field => {
    const value = values[field.id] ?? "";
    const displayValue = field.type === "select" ? field.options.find(option => option.id === value)?.label ?? ""
      : typeof value === "boolean" ? value ? "Yes" : "No"
      : typeof value === "object" ? `${value.name} (${value.type}, ${value.size} bytes)` : value;
    return { id: field.id, label: field.label, type: field.type, value, displayValue, consent: field.consent };
  });
  const attachmentHashes = attachments.map(attachment => ({ name: attachment.filename, type: attachment.contentType,
    hash: createHash("sha256").update(Buffer.from(attachment.content, "base64")).digest("hex") }));
  const payloadHash = createHash("sha256").update(JSON.stringify({ formId: form.id, revision: form.revision, locale, fingerprint, fields, attachmentHashes, ...(placement ? { placement } : {}) })).digest("hex");
  return { formId: form.id, name: form.name, revision: form.revision, locale, fingerprint, payloadHash, fields, ...placement };
}

export function publicContactNotification(snapshot: ContactFormSnapshot, recipient: string, leadId: string, replyTo: string | null, attachments: EmailAttachment[] = []): EmailMessage {
  return {
    to: recipient, subject: `[${snapshot.sourcePage === "real-estate-enquiry" ? "Deal enquiry" : "Contact"}] ${snapshot.name.replace(/[\r\n]+/g, " ").slice(0, 150)}`,
    text: [snapshot.sourcePage === "real-estate-enquiry" ? `Real Estate deal enquiry: ${snapshot.name}` : `${snapshot.serviceId ? "Service" : snapshot.sourcePage === "guests-dual-cta" ? "Guest owner" : snapshot.sourcePage === "about-contact" ? "About" : "Header"} contact: ${snapshot.name}`, `Lead: ${leadId}`, `Form: ${snapshot.formId} · revision ${snapshot.revision}`, `Language: ${snapshot.locale}`, ...(snapshot.serviceId ? [`Service: ${snapshot.serviceId}`, `Source: ${snapshot.sourcePage}`] : []), "",
      ...snapshot.fields.map(field => `${field.label}${field.consent ? " [consent]" : ""}: ${field.displayValue}`)].join("\n"),
    ...(replyTo ? { replyTo } : {}), ...(attachments.length ? { attachments } : {}),
  };
}
