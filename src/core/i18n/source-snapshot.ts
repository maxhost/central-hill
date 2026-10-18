import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { translationActorAttribution } from "./actor-attribution";
/** ADR0037: compose after a slice-owned saved CTE returning id. Empty gate means no writes. */
export function sourceSnapshotCtes(entityType: string, entityIds: SQL, fields: Record<string, string>, actor: string): SQL {
  const attribution = translationActorAttribution(actor);
  const values = JSON.stringify(Object.entries(fields).map(([field, value]) => ({ field, value })));
  return sql`source_values as (select field, value from jsonb_to_recordset(${values}::jsonb) as f(field text, value text)),
    source_upsert as (
      insert into translation (entity_type, entity_id, field, locale, value, state, updated_by, updated_by_user_id)
      select ${entityType}, e.id, v.field, 'en', v.value, 'draft', ${attribution.updated_by}::uuid, ${attribution.updated_by_user_id}
      from (${entityIds}) e cross join source_values v
      on conflict (entity_type, entity_id, field, locale) do update set value=excluded.value, state='draft', updated_by=excluded.updated_by, updated_by_user_id=excluded.updated_by_user_id, updated_at=now()
      returning id
    ), source_delete as (
      delete from translation t where t.entity_type=${entityType} and t.entity_id in (${entityIds})
      and t.field like 'block:%' and not exists (select 1 from source_values v where v.field=t.field)
      returning id
    )`;
}
