import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { uuid } from "@core/validation/primitives";
import { page_content } from "../schema";
import { pageKey } from "../schemas";
import { revalidatePage } from "./publish";

export async function revalidatePageTranslation(id: string): Promise<void> {
  if (!uuid.safeParse(id).success) return;
  const [row] = await db.select({ key: page_content.key }).from(page_content).where(eq(page_content.id, id)).limit(1);
  const parsed = pageKey.safeParse(row?.key);
  if (parsed.success) revalidatePage(parsed.data);
}
