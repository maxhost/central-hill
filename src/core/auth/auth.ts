import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@core/db/client";
import { env } from "@core/env";
import { account, session, user, verification } from "./schema";

/**
 * Better Auth instance (backoffice only — ADR 0009). Maps to our hand-written
 * Drizzle tables in `./schema`. RBAC is layered via the `staff_role` table
 * (see `./session`). The canonical column shape is verified against
 * `@better-auth/cli generate`.
 *
 * `secret`/`baseURL` come from `core/env` (both optional: in dev Better Auth
 * falls back to an ephemeral secret + the request origin; production must set
 * `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`). The HTTP handler is mounted at
 * `/api/auth/[...all]`.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
});
