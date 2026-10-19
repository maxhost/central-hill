import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
/** Guard before fixtures: both connection string and actual SQL identity are isolated. */
export async function assertEditorialTestDatabase(): Promise<void> {
  assert.match(process.env.DATABASE_URL ?? "", /\/pageeditors2qa(?:\?|$)/);
  const result = await db.execute(
    sql`select current_database() as database, current_user as username`,
  );
  assert.equal(result.rows[0]?.database, "pageeditors2qa");
  assert.equal(result.rows[0]?.username, "pageeditors2qa");
}
