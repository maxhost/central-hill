import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { LOCALES } from "@core/db/columns";
import { updateTag, revalidatePath } from "@core/revalidate";
import { headerContactUsageGuard } from "@slices/settings/contract";
import { FORMS_PUBLIC_TAGS } from "../public-types";

export async function refreshPublicForm(id: string): Promise<void> {
  // Invalidate even when unassigned: assigning it later must not revive old copy.
  updateTag(FORMS_PUBLIC_TAGS.form(id));
  updateTag(FORMS_PUBLIC_TAGS.all);
  const result = await db.execute(sql`select ${headerContactUsageGuard(id)} as used`);
  if (result.rows[0]?.used === true) for (const locale of LOCALES) revalidatePath(`/${locale}`, "layout");
}
