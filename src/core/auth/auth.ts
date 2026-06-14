import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@core/db/client";
import { account, session, user, verification } from "./schema";

/**
 * Better Auth instance (backoffice only — ADR 0009). Maps to our hand-written
 * Drizzle tables in `./schema`. RBAC is layered via the `staff_role` table.
 * The canonical column shape is verified against `@better-auth/cli generate`.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
});
