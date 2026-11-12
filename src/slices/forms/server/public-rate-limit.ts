import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { env } from "@core/env";
import { executeSerialized } from "@core/db/serialized";
import { HEADER_CONTACT_LOCK } from "../public-types";
import { form_public_rate_limit } from "../schema";

export const PUBLIC_CONTACT_LIMIT = 5;
export const PUBLIC_CONTACT_GLOBAL_LIMIT = 100;

/** Durable windows shared by app processes. The global ceiling bounds spoofed
 * or missing IPs, and counters never contain raw IP addresses. */
export async function admitPublicContact(ipAddress: string | null, submissionKey: string = randomUUID()): Promise<boolean> {
  const digest = createHmac("sha256", env.BETTER_AUTH_SECRET || env.DATABASE_URL).update(ipAddress || "unknown").digest("hex");
  const key = `header-contact:ip:${digest}`, globalKey = "header-contact:global";
  const attemptKey = `header-contact:attempt:${createHmac("sha256", env.BETTER_AUTH_SECRET || env.DATABASE_URL).update(digest + submissionKey).digest("hex")}`;
  const result = await executeSerialized(HEADER_CONTACT_LOCK, sql`
    with cleanup as (
      delete from ${form_public_rate_limit}
      where ${form_public_rate_limit.window_start}<clock_timestamp()-interval '1 hour'
        and ${form_public_rate_limit.key}<>${globalKey} and ${form_public_rate_limit.key}<>${key} and ${form_public_rate_limit.key}<>${attemptKey}
    ), prior_attempt as (
      select 1 from ${form_public_rate_limit} where ${form_public_rate_limit.key}=${attemptKey}
        and ${form_public_rate_limit.window_start}>clock_timestamp()-interval '10 minutes'
    ), global_counter as (
      insert into ${form_public_rate_limit}(key,attempts,window_start) values(${globalKey},1,clock_timestamp())
      on conflict(key) do update set
        attempts=case when form_public_rate_limit.window_start<=clock_timestamp()-interval '1 minute' then 1 else least(form_public_rate_limit.attempts+1,${PUBLIC_CONTACT_GLOBAL_LIMIT + 1}) end,
        window_start=case when form_public_rate_limit.window_start<=clock_timestamp()-interval '1 minute' then clock_timestamp() else form_public_rate_limit.window_start end
      returning attempts
    ), personal_counter as (
      insert into ${form_public_rate_limit}(key,attempts,window_start)
      select ${key},1,clock_timestamp() where (select attempts from global_counter)<=${PUBLIC_CONTACT_GLOBAL_LIMIT} and not exists(select 1 from prior_attempt)
      on conflict(key) do update set
        attempts=case when form_public_rate_limit.window_start<=clock_timestamp()-interval '10 minutes' then 1 else least(form_public_rate_limit.attempts+1,${PUBLIC_CONTACT_LIMIT + 1}) end,
        window_start=case when form_public_rate_limit.window_start<=clock_timestamp()-interval '10 minutes' then clock_timestamp() else form_public_rate_limit.window_start end
      returning attempts
    ), remember_attempt as (
      insert into ${form_public_rate_limit}(key,attempts,window_start)
      select ${attemptKey},1,clock_timestamp() from personal_counter where attempts<=${PUBLIC_CONTACT_LIMIT}
      on conflict(key) do update set attempts=1,window_start=clock_timestamp()
    ) select (select attempts from global_counter)<=${PUBLIC_CONTACT_GLOBAL_LIMIT}
      and (exists(select 1 from prior_attempt) or coalesce((select attempts<=${PUBLIC_CONTACT_LIMIT} from personal_counter),false)) as allowed
  `);
  return result.rows[0]?.allowed === true;
}
