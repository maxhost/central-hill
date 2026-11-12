import "server-only";
import { sql } from "drizzle-orm";
import { company_settings } from "../schema";
/** Trusted SQL seams for the one header placement, used only inside serialized mutations. */
export function headerContactAssignmentGuard(id: string) {
  return sql`exists(select 1 from ${company_settings} where ${company_settings.id}=(select id from company_settings order by created_at,id limit 1) and ${company_settings.header_contact_form_id}=${id}::uuid)`;
}
export function headerContactUsageGuard(id: string) {
  return sql`exists(select 1 from ${company_settings} where ${company_settings.header_contact_form_id}=${id}::uuid)`;
}
