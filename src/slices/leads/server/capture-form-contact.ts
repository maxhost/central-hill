import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { executeSerialized } from "@core/db/serialized";
import { HEADER_CONTACT_LOCK } from "@slices/forms/contract";
import { lead, lead_field } from "../schema";
import type { ContactCaptureInput, ContactCaptureResult } from "../form-capture-types";

/** Trusted assignment/revision SQL is composed by Forms. Capture and KV fields
 * commit together under the same serialization lock as Settings and archival. */
export async function captureFormContact(input: ContactCaptureInput, guard: SQL): Promise<ContactCaptureResult> {
  const sourcePage = input.sourcePage ?? "header-contact";
  const kind = sourcePage === "real-estate-enquiry" ? "deal_enquiry" : "contact";
  const consent = input.snapshot.fields.filter(field => field.consent && field.value === true).map(field => field.label).join("\n") || null;
  const fields = input.snapshot.fields.map(field => ({ key: field.id, value: field.displayValue }));
  if (input.email) fields.push({ key: "email", value: input.email });
  const result = await executeSerialized(HEADER_CONTACT_LOCK, sql`
    with existing as (
      select id,kind,form_snapshot,source_page from ${lead} where ${lead.submission_key}=${input.submissionKey}::uuid
    ), captured as (
      insert into ${lead}(kind,locale,source_page,marketing_consent,consent_text,consent_at,ip_address,user_agent,form_snapshot,submission_key)
      select ${kind},${input.snapshot.locale},${sourcePage},false,${consent},
        case when ${consent}::text is null then null else clock_timestamp() end,
        ${input.ipAddress},${input.userAgent},${JSON.stringify(input.snapshot)}::jsonb,${input.submissionKey}::uuid
      where (${guard}) and not exists(select 1 from existing)
      on conflict(submission_key) do nothing returning id
    ), captured_fields as (
      insert into ${lead_field}(lead_id,key,value)
      select captured.id,field.key,field.value from captured
      cross join jsonb_to_recordset(${JSON.stringify(fields)}::jsonb) as field(key text,value text)
    ) select
      case when not (${guard}) then 'stale'
        when exists(select 1 from captured) then 'created'
        when exists(select 1 from existing where kind=${kind} and source_page=${sourcePage} and form_snapshot->>'payloadHash'=${input.snapshot.payloadHash}
          and form_snapshot->>'formId'=${input.snapshot.formId}
          and form_snapshot->>'fingerprint'=${input.snapshot.fingerprint}
          and form_snapshot->>'revision'=${String(input.snapshot.revision)}) then 'duplicate'
        when exists(select 1 from existing) then 'conflict' else 'stale' end as status,
      coalesce((select id::text from captured),(select id::text from existing)) as lead_id
  `);
  const row = result.rows[0];
  if ((row?.status === "created" || row?.status === "duplicate") && typeof row.lead_id === "string") return { status: row.status, leadId: row.lead_id };
  return { status: row?.status === "conflict" ? "conflict" : "stale" };
}
