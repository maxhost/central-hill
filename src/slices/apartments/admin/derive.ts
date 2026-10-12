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

/* ── Ordering inside a building (spec building-detail-admin-editor, S2) ─────────── */

/** One apartment's slot in its building's order. */
export interface ApartmentSlot {
  id: string;
  position: number;
}

/** Direction of a ↑ / ↓ move in the building's Apartments tab. */
export type MoveDirection = "up" | "down";

/** Position for a new apartment: after the building's last one (`max + 1`), 0 when empty. */
export function nextApartmentPosition(positions: readonly number[]): number {
  return positions.length === 0 ? 0 : Math.max(...positions) + 1;
}

/** Display order of a building's apartments: `position`, then `id` as a stable tiebreaker. */
export function sortApartmentSlots(slots: readonly ApartmentSlot[]): ApartmentSlot[] {
  return [...slots].sort((a, b) =>
    a.position !== b.position ? a.position - b.position : a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
}

/**
 * Plans a ↑ / ↓ move. `slots` are ONE building's apartments (any order; sorted here).
 * Swaps `id` with its neighbour in `direction`, then renumbers the whole building to
 * `0..n-1` (heals duplicate or gapped positions from older data). Returns only the
 * rows whose position actually changes; `null` when it is a no-op (unknown id, or the
 * first row moving up / the last moving down).
 */
export function planApartmentMove(
  slots: readonly ApartmentSlot[],
  id: string,
  direction: MoveDirection,
): ApartmentSlot[] | null {
  const ordered = sortApartmentSlots(slots);
  const from = ordered.findIndex((s) => s.id === id);
  if (from === -1) return null;
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= ordered.length) return null;
  const moved = ordered[from]!;
  ordered[from] = ordered[to]!;
  ordered[to] = moved;
  return ordered
    .map((s, index) => ({ id: s.id, position: index, before: s.position }))
    .filter((s) => s.position !== s.before)
    .map(({ id: slotId, position }) => ({ id: slotId, position }));
}

/**
 * D6 guard: an apartment's building is fixed at creation. True when an update posts
 * a `building_id` other than the stored one (the save must then be rejected).
 */
export function isBuildingChange(storedBuildingId: string, postedBuildingId: string): boolean {
  return storedBuildingId !== postedBuildingId;
}
