import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { uuid } from "@core/validation/primitives";
import { neighbourhood } from "../schema";

/** Resolve legacy editor links after the caller's staff gate; never writes. */
export async function getGeographyLegacyEditorRedirect(
  type: string,
  id: string,
): Promise<string | null> {
  if (type !== "city" && type !== "neighbourhood") return null;
  if (!uuid.safeParse(id).success) return "/admin/pages";
  if (type === "city") return `/admin/cities/${id}`;
  const [row] = await db
    .select({ cityId: neighbourhood.city_id })
    .from(neighbourhood)
    .where(eq(neighbourhood.id, id))
    .limit(1);
  return row ? `/admin/cities/${row.cityId}` : "/admin/cities";
}
