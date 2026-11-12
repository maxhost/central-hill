"use server";

import { isIP } from "node:net";
import { headers } from "next/headers";
import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@core/db/client";
import { sendEmail } from "@core/email";
import { captureFormContact } from "@slices/leads/server-contract";
import { headerContactAssignmentGuard } from "@slices/settings/server-contract";
import { aboutContactAssignmentGuard, guestContactAssignmentGuard, realEstateEnquiryAssignmentGuard } from "@slices/pages/server-contract";
import { serviceEnquiryAssignmentGuard } from "@slices/services/server-contract";
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

const pageInputSchema = inputSchema.extend({ assignmentIdentity: z.string().regex(/^[a-f0-9]{32}$/) });
const serviceInputSchema = pageInputSchema.extend({ serviceId: formIdSchema });

/** Explicit entry points fix authority and source on the server; neither is
 * accepted as a caller-controlled destination. */
export async function submitHeaderContactForm(input: PublicContactInput, uploads?: FormData): Promise<PublicContactResult> {
  return submitContact("header-contact", input, uploads);
}
export async function submitAboutContactForm(input: PublicContactInput, uploads?: FormData): Promise<PublicContactResult> {
  return submitContact("about-contact", input, uploads);
}

export async function submitGuestOwnerContactForm(input: PublicContactInput, uploads?: FormData): Promise<PublicContactResult> {
  return submitContact("guests-dual-cta", input, uploads);
}

export async function submitRealEstateEnquiryForm(input: PublicContactInput, uploads?: FormData): Promise<PublicContactResult> {
  return submitContact("real-estate-enquiry", input, uploads);
}

export async function submitServiceEnquiryForm(input: PublicContactInput, uploads?: FormData): Promise<PublicContactResult> {
  return submitContact("service-enquiry", input, uploads);
}

async function submitContact(placement: "header-contact" | "about-contact" | "guests-dual-cta" | "real-estate-enquiry" | "service-enquiry", input: PublicContactInput, uploads?: FormData): Promise<PublicContactResult> {
  if (input && typeof input === "object" && typeof input.honeypot === "string" && input.honeypot.trim()) return { ok: true };
  const parsed = (placement === "service-enquiry" ? serviceInputSchema : placement !== "header-contact" ? pageInputSchema : inputSchema).safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  const value = parsed.data;
  const assignmentIdentity = "assignmentIdentity" in value && typeof value.assignmentIdentity === "string" ? value.assignmentIdentity : undefined;
  if (placement !== "header-contact" && !assignmentIdentity) return { ok: false, code: "validation" };
  const serviceId = "serviceId" in value && typeof value.serviceId === "string" ? value.serviceId.toLowerCase() : undefined;
  if (placement === "service-enquiry" && !serviceId) return { ok: false, code: "validation" };
  const sourcePage = placement === "service-enquiry" ? `service:${serviceId!}` as const : placement;
  try {
    const assignmentGuard: SQL = placement === "service-enquiry"
      ? serviceEnquiryAssignmentGuard(serviceId!, value.locale, value.id, assignmentIdentity ?? "")
      : placement === "real-estate-enquiry"
      ? realEstateEnquiryAssignmentGuard(value.id, assignmentIdentity ?? "")
      : placement === "guests-dual-cta"
      ? guestContactAssignmentGuard(value.id, assignmentIdentity ?? "")
      : placement === "about-contact" ? aboutContactAssignmentGuard(value.id, assignmentIdentity ?? "")
      : headerContactAssignmentGuard(value.id);
    const current = await db.execute(sql`select ${assignmentGuard} as assigned`);
    if (current.rows[0]?.assigned !== true) return { ok: false, code: "stale" };
    const source = await readPublicFormSource(value.id, value.locale);
    if (!source || source.form.revision !== value.expectedRevision || source.fingerprint !== value.fingerprint) return { ok: false, code: "stale" };
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const ipAddress = isIP(forwarded) ? forwarded : null;
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) || null;
    // All placements share the same durable counters, including attempt keys.
    if (!await admitPublicContact(ipAddress, value.submissionKey)) return { ok: false, code: "rate_limited" };
    const uploaded = await validateAttachments(source.definition, uploads);
    const checked = validateValues(source.definition, value.values, uploaded.files);
    const fieldErrors = { ...checked.fieldErrors, ...uploaded.fieldErrors };
    if (Object.keys(fieldErrors).length) return { ok: false, code: "validation", fieldErrors };
    const snapshot = buildContactSnapshot(source.form, source.definition, checked.values, value.locale, source.fingerprint, uploaded.attachments,
      placement === "service-enquiry" ? { sourcePage: `service:${serviceId!}`, assignmentIdentity: assignmentIdentity ?? "", serviceId: serviceId! }
        : placement !== "header-contact" ? { sourcePage: placement, assignmentIdentity: assignmentIdentity ?? "" } : undefined);
    const reply = source.definition.replyToFieldId ? checked.values[source.definition.replyToFieldId] : undefined;
    const email = typeof reply === "string" && z.email().max(254).safeParse(reply).success ? reply : null;
    const captured = await captureFormContact({ sourcePage, submissionKey: value.submissionKey, snapshot, email, ipAddress, userAgent },
      sql`${assignmentGuard} and ${assignableHeaderFormGuard(value.id, value.expectedRevision)}`);
    if (captured.status === "stale") return { ok: false, code: "stale" };
    if (captured.status === "conflict") return { ok: false, code: "validation" };
    if (captured.status === "duplicate") return { ok: true };
    if (!("leadId" in captured)) return { ok: false, code: "server" };
    // Only the unique insert winner notifies; capture is already durable.
    const delivery = await sendEmail(publicContactNotification(snapshot, source.form.recipient, captured.leadId, email, uploaded.attachments));
    if (!delivery.ok) console.error(`[forms:${placement}] notification failed after capture`);
    return { ok: true };
  } catch {
    console.error(`[forms:${placement}] submission failed`);
    return { ok: false, code: "server" };
  }
}
