"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { deleteContent, deleteSlugs } from "@core/i18n/content-write";
import { propertyGraphLockQuery } from "../server/editorial-bootstrap";
import { revalidateApartment } from "../server/publish";
import { recomputeBuildingStats } from "../server/stats";
import type { MoveDirection } from "./derive";
export type ApartmentSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "slug_conflict" | "not_found" | "server" };
/** ADR0058 retires every live single-language write, including legacy callers. */
export async function saveApartment(
  raw: unknown,
): Promise<ApartmentSaveResult> {
  await requireStaff();
  void raw;
  return {
    ok: false,
    error: "validation",
    fieldErrors: {
      _source:
        "Use the apartment locale editor's Save draft and Publish actions.",
    },
  };
}
function refresh(id: string, buildingId: string) {
  revalidateApartment(id, buildingId);
  revalidatePath("/admin/buildings");
  revalidatePath(`/admin/buildings/${buildingId}`, "layout");
}
export async function deleteApartment(
  id: string,
  parentId?: string,
): Promise<{ ok: boolean }> {
  await requireStaff();
  if (
    !z.uuid().safeParse(id).success ||
    (parentId && !z.uuid().safeParse(parentId).success)
  )
    return { ok: false };
  try {
    const [, result] = await db.batch([
      propertyGraphLockQuery(),
      db.execute(sql`delete from apartment where id=${id}::uuid
      ${parentId ? sql`and building_id=${parentId}::uuid` : sql``} returning building_id`),
    ]);
    const row = result.rows[0];
    if (!row) return { ok: false };
    await deleteContent("apartment", id);
    await deleteSlugs("apartment", id);
    const buildingId = String(row.building_id);
    await recomputeBuildingStats(buildingId);
    refresh(id, buildingId);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
/** All decisions and writes run after the same graph lock, never from stale slots.
 * The row order is global operational metadata and does not touch locale JSON. */
export async function moveApartment(
  id: string,
  direction: MoveDirection,
): Promise<{ ok: boolean }> {
  await requireStaff();
  if (
    !z.uuid().safeParse(id).success ||
    (direction !== "up" && direction !== "down")
  )
    return { ok: false };
  try {
    const [, result] = await db.batch([
      propertyGraphLockQuery(),
      db.execute(sql`with target as materialized (
      select building_id from apartment where id=${id}::uuid
    ), ordered as materialized (
      select id,position,row_number() over(order by position,id)-1 as slot from apartment
      where building_id=(select building_id from target)
    ), current as (select slot from ordered where id=${id}::uuid), neighbour as (
      select id,slot from ordered where slot=(select slot ${direction === "up" ? sql`-1` : sql`+1`} from current)
    ), moved as (
      update apartment set position=case when apartment.id=${id}::uuid then (select slot from neighbour)::int
        when apartment.id=(select id from neighbour) then (select slot from current)::int else ordered.slot::int end,
        updated_at=now() from ordered where apartment.id=ordered.id and exists(select 1 from neighbour) returning apartment.id
    ) select building_id from target`),
    ]);
    const row = result.rows[0];
    if (!row) return { ok: false };
    refresh(id, String(row.building_id));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
