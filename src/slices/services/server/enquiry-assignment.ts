import "server-only";
import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { SERVICE_TAGS } from "../contract";

export interface ServiceEnquiryAssignment { formId: string; identity: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const selectedId = sql`en.published #>> '{content,enquiry_form_id}'`;
const identity = sql`md5(jsonb_build_array(en.service_id,lower(${selectedId}),en.published_at)::text)`;

/** The requested locale must itself be published. Draft/shared revisions do not
 * identify the EN publication; slug changes never change the stable service ID. */
export function serviceEnquiryAssignmentGuard(serviceId: string, locale: Locale, formId: string, expectedIdentity: string) {
  return sql`exists(select 1 from service_locale_content en join service s on s.id=en.service_id
    where en.service_id=${serviceId}::uuid and en.locale='en' and en.published is not null
      and s.status='published' and s.booking_type='enquiry'
      and lower(${selectedId})=lower(${formId}) and ${identity}=${expectedIdentity}
      and exists(select 1 from service_locale_content target where target.service_id=s.id
        and target.locale=${locale} and target.published is not null))`;
}

/** Reservations remain in use even while a service is archived or non-enquiry. */
export function serviceEnquiryUsageGuard(formId: string) {
  return sql`exists(select 1 from service_locale_content en where en.locale='en'
    and (lower(en.draft #>> '{content,enquiry_form_id}')=lower(${formId})
      or lower(${selectedId})=lower(${formId})))`;
}

export async function readServiceEnquiryAssignment(serviceId: string): Promise<ServiceEnquiryAssignment | null> {
  if (!uuid.test(serviceId)) return null;
  return unstable_cache(async () => {
    const result = await db.execute(sql`select ${selectedId} as form_id,${identity} as identity
      from service_locale_content en join service s on s.id=en.service_id
      where en.service_id=${serviceId}::uuid and en.locale='en' and en.published is not null
        and s.status='published' and s.booking_type='enquiry' limit 1`);
    const row = result.rows[0];
    return typeof row?.form_id === "string" && uuid.test(row.form_id) && typeof row.identity === "string"
      ? { formId: row.form_id.toLowerCase(), identity: row.identity } : null;
  }, ["service-enquiry-assignment:v1",serviceId.toLowerCase()], { tags: [SERVICE_TAGS.list] })();
}

/** Forms owns the invalidation call; Services owns its routes and usage query. */
export async function serviceEnquiryPaths(formId: string): Promise<string[]> {
  if (!uuid.test(formId)) return [];
  const result = await db.execute(sql`select distinct sl.locale,sl.slug from slug sl
    join service_locale_content en on en.service_id=sl.entity_id and en.locale='en'
    where sl.entity_type='service' and sl.locale in ('en','es','pt','fr')
      and (lower(en.draft #>> '{content,enquiry_form_id}')=lower(${formId})
        or lower(${selectedId})=lower(${formId}))`);
  return result.rows.flatMap(row => typeof row.locale === "string" && typeof row.slug === "string"
    ? [`/${row.locale}/services/${row.slug}`] : []);
}
