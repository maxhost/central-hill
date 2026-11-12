import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { LOCALES } from "@core/db/columns";
import { updateTag, revalidatePath } from "@core/revalidate";
import { headerContactUsageGuard } from "@slices/settings/contract";

export async function refreshPublicForm(id: string): Promise<void> {
  // Invalidate even when unassigned: assigning it later must not revive old copy.
  updateTag(`form_definition:${id}`);
  updateTag("forms:public");
  const result = await db.execute(sql`select ${headerContactUsageGuard(id)} as used`);
  if (result.rows[0]?.used === true) for (const locale of LOCALES) revalidatePath(`/${locale}`, "layout");
}
