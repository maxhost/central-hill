import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { buildingStatsUpdateSql } from "@slices/buildings/contract";
import { propertyGraphLockQuery } from "./editorial-bootstrap";
/** Unique identity aggregate. EN is the stable capacity representative when
 * available, otherwise the first published locale. Missing locale rows retain
 * legacy read compatibility; four explicit null publications never fall back. */
export function apartmentAnyPublishedStatsSql(buildingId: string) {
  return sql`select count(*)::int as apartments,coalesce(sum(units.capacity),0)::int as capacity,coalesce(sum(units.beds),0)::int as beds
    from (
      select identity.id,
        coalesce((common.data->'content'->>'max_guests')::int,(snapshot.published->'content'->>'max_guests')::int,identity.max_guests) as capacity,
        coalesce((common.data->'content'->>'beds_count')::int,(snapshot.published->'content'->>'beds_count')::int,identity.beds_count) as beds
      from apartment identity left join apartment_shared_content common on common.apartment_id=identity.id left join lateral (
        select published from apartment_locale_content where apartment_id=identity.id and published is not null
        order by case locale when 'en' then 0 when 'es' then 1 when 'pt' then 2 else 3 end limit 1
      ) snapshot on true
      where identity.building_id=${buildingId}::uuid and identity.status<>'archived' and (
        snapshot.published is not null or (identity.status='published' and
          (select count(*) from apartment_locale_content where apartment_id=identity.id)<4)
      )
    ) units`;
}
/** Both owned SQL fragments execute in the fresh statement after the graph lock.
 * A slower earlier lifecycle caller cannot overwrite newer capacity totals. */
export async function recomputeBuildingStats(
  buildingId: string,
): Promise<void> {
  await db.batch([
    propertyGraphLockQuery(),
    db.execute(
      buildingStatsUpdateSql(
        buildingId,
        apartmentAnyPublishedStatsSql(buildingId),
      ),
    ),
  ]);
}
