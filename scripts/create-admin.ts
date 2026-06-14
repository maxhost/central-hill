import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@core/auth";
import { db } from "@core/db/client";
import { staff_role, user } from "@core/auth/schema";

/**
 * One-off backoffice bootstrap: create a staff user (via Better Auth, so the
 * password is hashed correctly) and grant a `staff_role`. Run with tsx:
 *
 *   npx tsx scripts/create-admin.ts <email> <password> [name] [role]
 *
 * `role` ∈ admin | editor | translator (default: admin). Requires DATABASE_URL
 * (and, in production, BETTER_AUTH_SECRET) in the environment. Idempotent on the
 * role grant; re-running with an existing email surfaces Better Auth's error.
 */

const ROLES = ["admin", "editor", "translator"] as const;
type Role = (typeof ROLES)[number];

const [email, password, name = "Admin", roleArg = "admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [name] [role]");
  process.exit(1);
}
if (!ROLES.includes(roleArg as Role)) {
  console.error(`Invalid role "${roleArg}" — expected one of: ${ROLES.join(", ")}`);
  process.exit(1);
}
const role = roleArg as Role;

await auth.api.signUpEmail({ body: { email, name, password } });

const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
if (!u) throw new Error(`User ${email} was not created.`);

const [existing] = await db
  .select({ id: staff_role.id })
  .from(staff_role)
  .where(eq(staff_role.user_id, u.id))
  .limit(1);
if (!existing) await db.insert(staff_role).values({ user_id: u.id, role });

console.log(`✓ Staff user ${email} ready (role: ${role}).`);
process.exit(0);
