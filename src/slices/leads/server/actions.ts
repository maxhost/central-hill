"use server";
import { headers } from "next/headers";
import { db } from "@core/db/client";
import { lead, lead_field } from "../schema";
import { type LeadSubmission, leadSubmission } from "../validation";
import type { LeadActionResult } from "../types";
import { flattenFields } from "./fields";
import { notifyStaff } from "./notify";

/**
 * Public lead submission (slice `leads`, ADR 0011/0014). The single entry point for
 * all four form `kind`s. Re-validates the discriminated union server-side (never
 * trusts the client), stamps server-side consent proof, persists `lead` + the
 * `lead_field` KV rows, then fires a best-effort staff notification.
 *
 * Never reveals internals: validation failures return `{ error: "validation" }`
 * with per-field messages; anything else returns `{ error: "server" }`.
 *
 * `honeypot` is a hidden form field that real users leave empty; a non-empty value
 * is treated as a bot — we return success without persisting (don't tip off bots).
 */
export async function submitLead(
  input: LeadSubmission,
  honeypot?: string,
): Promise<LeadActionResult> {
  if (honeypot && honeypot.trim() !== "") return { ok: true }; // silently drop bots

  const parsed = leadSubmission.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      // Drop the leading "fields" segment so keys match form field names.
      const path = issue.path.filter((p) => p !== "fields").join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, error: "validation", fieldErrors };
  }
  const submission = parsed.data;

  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = h.get("user-agent")?.slice(0, 500) || null;

    const [row] = await db
      .insert(lead)
      .values({
        kind: submission.kind,
        locale: submission.locale,
        source_page: submission.source_page,
        marketing_consent: submission.marketing_consent,
        consent_text: submission.consent_text,
        consent_at: new Date(),
        ip_address: ip,
        user_agent: userAgent,
      })
      .returning({ id: lead.id });

    if (!row) return { ok: false, error: "server" };

    const fields = flattenFields(submission);
    if (fields.length) {
      await db.insert(lead_field).values(
        fields.map((f) => ({ lead_id: row.id, key: f.key, value: f.value })),
      );
    }

    // Best-effort — a mail failure must never fail a captured lead.
    await notifyStaff(submission, row.id);

    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
