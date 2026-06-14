import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@core/env";

/**
 * Drizzle client over Neon's HTTP driver — serverless-friendly, used by slice
 * `server/` query functions and backoffice actions. Public pages are statically
 * rendered and must NOT call this at request time (conventions.md → rendering).
 */
const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql);
