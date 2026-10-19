import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { uuid } from "@core/validation/primitives";
import { page_content } from "../schema";
import { usesPageLocaleDrafts } from "../editorial-registry";

/** Translation slice asks Pages to resolve its own entity identity/policy. */
export async function getPageEditorialRedirect(type: string, id: string): Promise<string | null> {
  if (type !== "page_content" || !uuid.safeParse(id).success) return null;
  const [row] = await db.select({ key: page_content.key }).from(page_content).where(eq(page_content.id, id)).limit(1);
  return row && usesPageLocaleDrafts(row.key) ? `/admin/pages/${row.key}` : null;
}
