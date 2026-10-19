import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { translationActorAttribution } from "./actor-attribution";
import { hashSource } from "./translate";
import type { Locale } from "@core/db/columns";

/** ADR0038: complete target locale snapshot, gated by a slice revision-checked saved CTE. */
export function targetSnapshotCtes(
  entityType: string, entityIds: SQL, locale: Exclude<Locale, "en">,
  fields: Record<string, { value: string; sourceValue: string }>,
  state: "needs_review" | "approved", actor: string,
): SQL {
  const attribution = translationActorAttribution(actor);
  const values = JSON.stringify(Object.entries(fields).map(([field, row]) => ({ field, value: row.value.trim(), source_hash: hashSource(row.sourceValue) })));
  return sql`target_values as (select field,value,source_hash from jsonb_to_recordset(${values}::jsonb) as f(field text,value text,source_hash text)),
    target_upsert as (
      insert into translation(entity_type,entity_id,field,locale,value,state,source_hash,updated_by,updated_by_user_id)
      select ${entityType},e.id,v.field,${locale},v.value,${state},v.source_hash,${attribution.updated_by}::uuid,${attribution.updated_by_user_id}
      from (${entityIds}) e cross join target_values v where v.value<>''
      on conflict(entity_type,entity_id,field,locale) do update set value=excluded.value,state=excluded.state,
      source_hash=excluded.source_hash,updated_by=excluded.updated_by,updated_by_user_id=excluded.updated_by_user_id,updated_at=now()
      returning id
    ), target_delete as (
      delete from translation t where t.entity_type=${entityType} and t.entity_id in (${entityIds})
      and t.locale=${locale} and t.field like 'block:%'
      and not exists(select 1 from target_values v where v.field=t.field and v.value<>'') returning id
    )`;
}
