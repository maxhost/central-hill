import "server-only";
import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@core/db/client";
import { page_locale_content } from "../schema";
import { pageLocaleTag } from "../editorial-registry";

export interface RealEstateEnquiryAssignment { formId: string; identity: string }
const selectedId = sql`published #>> '{content,deal_enquiry,form_id}'`;
// Draft saves increment revision but never change this identity. A new published
// assignment has its own timestamp, including an A→B→A change while a form is open.
const identity = sql`md5(jsonb_build_array(${selectedId},published_at)::text)`;
export function realEstateEnquiryAssignmentGuard(id: string, expectedIdentity: string) {
  return sql`exists(select 1 from ${page_locale_content} where page_key='real_estate' and locale='en' and lower(${selectedId})=lower(${id}) and ${identity}=${expectedIdentity})`;
}
export function realEstateEnquiryUsageGuard(id: string) {
  return sql`exists(select 1 from ${page_locale_content} where page_key='real_estate' and locale='en' and (lower(draft #>> '{content,deal_enquiry,form_id}')=lower(${id}) or lower(${selectedId})=lower(${id})))`;
}
export const readRealEstateEnquiryAssignment = unstable_cache(async (): Promise<RealEstateEnquiryAssignment | null> => {
  const result = await db.execute(sql`select ${selectedId} as form_id,${identity} as identity from ${page_locale_content} where page_key='real_estate' and locale='en' limit 1`);
  const row = result.rows[0];
  return typeof row?.form_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.form_id) && typeof row.identity === "string" ? { formId: row.form_id.toLowerCase(), identity: row.identity } : null;
}, ["real-estate-enquiry-assignment:v1"], { tags: [pageLocaleTag("real_estate", "en")] });
