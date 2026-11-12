"use server";

import { isIP } from "node:net";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@core/db/client";
import { sendEmail } from "@core/email";
import { captureFormContact } from "@slices/leads/server-contract";
import { headerContactAssignmentGuard } from "@slices/settings/server-contract";
import { assignableHeaderFormGuard, readPublicFormSource } from "./public-queries";
import { validateAttachments } from "./attachments";
import { formIdSchema, revisionSchema, validateValues } from "../validation";
import { admitPublicContact } from "./public-rate-limit";
import { buildContactSnapshot, publicContactNotification } from "./public-notification";
import type { PublicContactInput, PublicContactResult } from "../public-types";

const inputSchema = z.object({
  id: formIdSchema, expectedRevision: revisionSchema,
  locale: z.enum(["en", "es", "pt", "fr"]),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/), submissionKey: formIdSchema,
  values: z.record(formIdSchema, z.union([z.string().max(10000), z.boolean()])).refine(values => Object.keys(values).length <= 40),
  honeypot: z.string().max(1000),
}).strict();

/** The header placement is the authority. No staff login is needed; the caller
 * cannot choose another saved draft, recipient, lead kind, labels or source. */
export async function submitHeaderContactForm(input: PublicContactInput, uploads?: FormData): Promise<PublicContactResult> {
  if (input && typeof input === "object" && typeof input.honeypot === "string" && input.honeypot.trim()) return { ok: true };
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  const value = parsed.data;
  try {
    const current = await db.execute(sql`select ${headerContactAssignmentGuard(value.id)} as assigned`);
    if (current.rows[0]?.assigned !== true) return { ok: false, code: "stale" };
    const source = await readPublicFormSource(value.id, value.locale);
    if (!source || source.form.revision !== value.expectedRevision || source.fingerprint !== value.fingerprint) return { ok: false, code: "stale" };
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const ipAddress = isIP(forwarded) ? forwarded : null;
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) || null;
    // Admission bounds allocations; a global ceiling also bounds missing/spoofed IPs.
    if (!await admitPublicContact(ipAddress, value.submissionKey)) return { ok: false, code: "rate_limited" };
    const uploaded = await validateAttachments(source.definition, uploads);
    const checked = validateValues(source.definition, value.values, uploaded.files);
    const fieldErrors = { ...checked.fieldErrors, ...uploaded.fieldErrors };
    if (Object.keys(fieldErrors).length) return { ok: false, code: "validation", fieldErrors };
    const snapshot = buildContactSnapshot(source.form, source.definition, checked.values, value.locale, source.fingerprint, uploaded.attachments);
    const reply = source.definition.replyToFieldId ? checked.values[source.definition.replyToFieldId] : undefined;
    const email = typeof reply === "string" && z.email().max(254).safeParse(reply).success ? reply : null;
    const captured = await captureFormContact({ submissionKey: value.submissionKey, snapshot, email, ipAddress, userAgent },
      sql`${headerContactAssignmentGuard(value.id)} and ${assignableHeaderFormGuard(value.id, value.expectedRevision)}`);
    if (captured.status === "stale") return { ok: false, code: "stale" };
    if (captured.status === "conflict") return { ok: false, code: "validation" };
    if (captured.status === "duplicate") return { ok: true };
    if (!("leadId" in captured)) return { ok: false, code: "server" };
    // Only the unique insert winner attempts email; capture is already durable.
    const delivery = await sendEmail(publicContactNotification(snapshot, source.form.recipient, captured.leadId, email, uploaded.attachments));
    if (!delivery.ok) console.error("[forms:header-contact] notification failed after capture");
    return { ok: true };
  } catch {
    console.error("[forms:header-contact] submission failed");
    return { ok: false, code: "server" };
  }
}
