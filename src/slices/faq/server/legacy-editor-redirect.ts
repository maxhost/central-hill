import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { uuid } from "@core/validation/primitives";
import { faq_item } from "../schema";

/** Resolve a retired generic review to its owning group after a staff gate. */
export async function getFaqLegacyEditorRedirect(
  type: string,
  id: string,
): Promise<string | null> {
  if (type !== "faq_item") return null;
  if (!uuid.safeParse(id).success) return "/admin/pages";
  const [row] = await db
    .select({ groupId: faq_item.group_id })
    .from(faq_item)
    .where(eq(faq_item.id, id))
    .limit(1);
  return row ? `/admin/faq/${row.groupId}` : "/admin/faq";
}
