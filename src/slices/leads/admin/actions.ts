"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { lead } from "../schema";
import { leadStatus } from "../validation";

/**
 * Backoffice mutations for the leads inbox (S12 — slice `leads`). Each action is
 * an independent entry point, so it re-gates with `requireStaff()` (defence in
 * depth — never relying solely on the `(panel)` layout gate; ADR 0009/0017) and
 * re-validates its input server-side. After a write we `revalidatePath` the
 * affected admin routes so the dynamic inbox/detail re-render with fresh data.
 */

export type LeadAdminResult = { ok: true } | { ok: false; error: "validation" | "not_found" };

function revalidateLead(id: string): void {
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
}

/** Move a lead through the pipeline (`new → in_progress → closed`, any order). */
export async function setLeadStatus(id: string, status: string): Promise<LeadAdminResult> {
  await requireStaff();
  const parsed = leadStatus.safeParse(status);
  if (!parsed.success) return { ok: false, error: "validation" };

  const updated = await db
    .update(lead)
    .set({ status: parsed.data, updated_at: new Date() })
    .where(eq(lead.id, id))
    .returning({ id: lead.id });
  if (updated.length === 0) return { ok: false, error: "not_found" };

  revalidateLead(id);
  return { ok: true };
}

/** Claim a lead for the signed-in staff member (`assigned_to → user.id`). */
export async function assignLeadToMe(id: string): Promise<LeadAdminResult> {
  const staff = await requireStaff();
  const updated = await db
    .update(lead)
    .set({ assigned_to: staff.userId, updated_at: new Date() })
    .where(eq(lead.id, id))
    .returning({ id: lead.id });
  if (updated.length === 0) return { ok: false, error: "not_found" };

  revalidateLead(id);
  return { ok: true };
}

/** Release a lead's assignment. */
export async function unassignLead(id: string): Promise<LeadAdminResult> {
  await requireStaff();
  const updated = await db
    .update(lead)
    .set({ assigned_to: null, updated_at: new Date() })
    .where(eq(lead.id, id))
    .returning({ id: lead.id });
  if (updated.length === 0) return { ok: false, error: "not_found" };

  revalidateLead(id);
  return { ok: true };
}
