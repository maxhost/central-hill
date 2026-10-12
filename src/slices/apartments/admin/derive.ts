import { eq, type SQL } from "drizzle-orm";
import { apartment } from "../schema";

/**
 * Pure helpers behind the apartments admin queries (spec building-detail-admin-editor,
 * S1). No DB client, no `server-only`, so they run under `tsx --test`. The queries in
 * `admin/queries.ts` use them to build the list filter and tally per-building counts.
 */

type ApartmentStatus = "draft" | "published" | "archived";

/** Apartment counts for one building: every status, and published only. */
export interface ApartmentCounts {
  total: number;
  published: number;
}

/** WHERE clause for the admin list: one building's apartments, or all when omitted. */
export function apartmentListWhere(buildingId?: string): SQL | undefined {
  return buildingId ? eq(apartment.building_id, buildingId) : undefined;
}

/**
 * Folds `(building_id, status, n)` rows (a GROUP BY over both columns) into
 * `buildingId → { total, published }`. Buildings without apartments are absent.
 */
export function tallyApartmentCounts(
  rows: { building_id: string; status: ApartmentStatus; n: number }[],
): Map<string, ApartmentCounts> {
  const out = new Map<string, ApartmentCounts>();
  for (const r of rows) {
    const n = Number(r.n);
    const counts = out.get(r.building_id) ?? { total: 0, published: 0 };
    counts.total += n;
    if (r.status === "published") counts.published += n;
    out.set(r.building_id, counts);
  }
  return out;
}
