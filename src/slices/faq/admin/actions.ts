"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { deleteContent, setSourceContent } from "@core/i18n/content-write";
import { FAQ_ITEM } from "../contract";
import { faq_group, faq_item } from "../schema";
import { revalidateFaq } from "../server/publish";
import { type FaqGroupSaveInput, faqGroupSaveInput } from "./validation";

/**
 * Backoffice write actions for slice `faq` (S12). A group + its items are saved
 * together. The group `key`/`position` are plain columns (no slug table); the items'
 * source [T] question/answer go through the `core/i18n` write seam (ADR 0019). Items
 * are upserted by id so approved translations survive an edit; removed items have
 * their translations cleaned (the translation rows are polymorphic — no FK cascade).
 * On success the `faq-list` tag is busted (cascading every embedding S9 page).
 */

export type FaqGroupSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "server" };

function fieldErrorsFrom(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export async function saveFaqGroup(raw: unknown): Promise<FaqGroupSaveResult> {
  const staff = await requireStaff();

  const parsed = faqGroupSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  try {
    let id = input.id ?? "";

    if (input.id) {
      const [exists] = await db
        .select({ id: faq_group.id })
        .from(faq_group)
        .where(eq(faq_group.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(faq_group)
        .set({ key: input.key, position: input.position, updated_at: new Date() })
        .where(eq(faq_group.id, input.id));
    } else {
      const [ins] = await db
        .insert(faq_group)
        .values({ key: input.key, position: input.position })
        .returning({ id: faq_group.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    await persistItems(id, input.items, staff.userId);

    revalidateFaq();
    revalidatePath("/admin/faq");
    revalidatePath(`/admin/faq/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteFaqGroup(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    // Item translations are polymorphic (no FK cascade) — clean them before the
    // group delete cascades the faq_item rows away.
    const itemRows = await db
      .select({ id: faq_item.id })
      .from(faq_item)
      .where(eq(faq_item.group_id, id));

    await db.delete(faq_group).where(eq(faq_group.id, id)); // cascades faq_item rows
    for (const r of itemRows) await deleteContent(FAQ_ITEM, r.id);

    revalidateFaq();
    revalidatePath("/admin/faq");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Upsert FAQ items by id (preserving translations), drop the removed ones. */
async function persistItems(
  groupId: string,
  items: FaqGroupSaveInput["items"],
  updatedBy: string,
): Promise<void> {
  const existing = await db
    .select({ id: faq_item.id })
    .from(faq_item)
    .where(eq(faq_item.group_id, groupId));
  const existingIds = new Set(existing.map((r) => r.id));
  const kept = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    let itemId = item.id && existingIds.has(item.id) ? item.id : null;
    if (itemId) {
      await db
        .update(faq_item)
        .set({ status: item.status, position: i, updated_at: new Date() })
        .where(eq(faq_item.id, itemId));
    } else {
      const [ins] = await db
        .insert(faq_item)
        .values({ group_id: groupId, position: i, status: item.status })
        .returning({ id: faq_item.id });
      if (!ins) continue;
      itemId = ins.id;
    }
    kept.add(itemId);
    await setSourceContent(
      FAQ_ITEM,
      itemId,
      { question: item.question, answer: item.answer },
      { updatedBy },
    );
  }

  for (const exId of existingIds) {
    if (!kept.has(exId)) {
      await db.delete(faq_item).where(eq(faq_item.id, exId));
      await deleteContent(FAQ_ITEM, exId);
    }
  }
}
