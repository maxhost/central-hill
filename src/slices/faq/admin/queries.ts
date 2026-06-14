import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadContent } from "@core/i18n/content";
import { FAQ_ITEM } from "../contract";
import { faq_group, faq_item } from "../schema";

/**
 * Backoffice reads for slice `faq` (S12). Not cache-wrapped (admin is dynamic) and
 * return **all** item statuses + **source-locale** ([T] en) values for editing.
 */

const SOURCE = "en" as const;

type Status = "draft" | "published" | "archived";

export interface FaqGroupAdminListItem {
  id: string;
  key: string;
  position: number;
  itemCount: number;
}

/** All FAQ groups with their item counts, in display order. */
export async function listFaqGroupsAdmin(): Promise<FaqGroupAdminListItem[]> {
  return db
    .select({
      id: faq_group.id,
      key: faq_group.key,
      position: faq_group.position,
      itemCount: sql<number>`count(${faq_item.id})::int`,
    })
    .from(faq_group)
    .leftJoin(faq_item, eq(faq_item.group_id, faq_group.id))
    .groupBy(faq_group.id)
    .orderBy(asc(faq_group.position));
}

export interface FaqItemEdit {
  id: string;
  status: Status;
  question: string;
  answer: string;
}

export interface FaqGroupEditData {
  id: string;
  key: string;
  position: number;
  items: FaqItemEdit[];
}

/** Full editable record for one group + its items (source values), or null. */
export async function getFaqGroupForEdit(id: string): Promise<FaqGroupEditData | null> {
  const [group] = await db.select().from(faq_group).where(eq(faq_group.id, id)).limit(1);
  if (!group) return null;

  const itemRows = await db
    .select({ id: faq_item.id, status: faq_item.status })
    .from(faq_item)
    .where(eq(faq_item.group_id, id))
    .orderBy(asc(faq_item.position));

  const content = await loadContent(
    itemRows.map((r) => ({ type: FAQ_ITEM, id: r.id })),
    SOURCE,
  );

  return {
    id: group.id,
    key: group.key,
    position: group.position,
    items: itemRows.map((r) => ({
      id: r.id,
      status: r.status,
      question: content.get(FAQ_ITEM, r.id, "question") ?? "",
      answer: content.get(FAQ_ITEM, r.id, "answer") ?? "",
    })),
  };
}
