import "server-only";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { sqlClient } from "./client";

/** Separate statements are essential: READ COMMITTED acquires a fresh snapshot
 * after waiting for the transaction lock. Neon HTTP has no interactive transactions. */
export async function executeSerialized(key: string, statement: SQL): Promise<{ rows: Record<string, unknown>[] }> {
  const query = new PgDialect().sqlToQuery(statement);
  const result = await sqlClient.transaction([
    sqlClient.query("select pg_advisory_xact_lock(hashtextextended($1,0))", [key]),
    sqlClient.query(query.sql, query.params),
  ], { isolationLevel: "ReadCommitted", fullResults: true, arrayMode: false });
  return { rows: result[1]?.rows ?? [] };
}
