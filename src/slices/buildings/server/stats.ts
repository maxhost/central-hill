import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { BuildingStats } from "../contract";
import { building } from "../schema";

/**
 * Persist a building's denormalized apartment stats (data-model.md). Buildings
 * **cannot read the apartment table** (golden rule 2 — that's S3's), so the
 * aggregate is computed by the apartments admin over its own table and handed in
 * here; this slice owns the write to the `building` row. Called by the apartments
 * publish action (the recompute escalation noted in `apartments/server/publish.ts`).
 */
export async function setBuildingStats(buildingId: string, stats: BuildingStats): Promise<void> {
  await db
    .update(building)
    .set({
      apartments_count: stats.apartments,
      total_capacity: stats.capacity,
      beds_count: stats.beds,
      updated_at: new Date(),
    })
    .where(eq(building.id, buildingId));
}
