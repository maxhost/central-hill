import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
// Buildings owns the stat columns; we hand it the aggregate computed over OUR table
// (golden rule 2 — buildings can't read the apartment table). This closes the
// recompute escalation noted in `server/publish.ts`.
import { setBuildingStats } from "@slices/buildings/contract";
import { apartment } from "../schema";

/**
 * Recompute a building's denormalized apartment stats from the **published** units
 * and persist them through the buildings contract. Called by the apartments admin
 * after any change to the published set (save / delete / building reassignment).
 */
export async function recomputeBuildingStats(buildingId: string): Promise<void> {
  const [agg] = await db
    .select({
      apartments: sql<number>`count(*)::int`,
      capacity: sql<number>`coalesce(sum(${apartment.max_guests}), 0)::int`,
      beds: sql<number>`coalesce(sum(${apartment.beds_count}), 0)::int`,
    })
    .from(apartment)
    .where(and(eq(apartment.building_id, buildingId), eq(apartment.status, "published")));

  await setBuildingStats(buildingId, {
    apartments: agg?.apartments ?? 0,
    capacity: agg?.capacity ?? 0,
    beds: agg?.beds ?? 0,
  });
}
