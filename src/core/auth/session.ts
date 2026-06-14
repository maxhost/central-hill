import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@core/db/client";
import { auth } from "./auth";
import { staff_role } from "./schema";

/**
 * Backoffice RBAC helpers (ADR 0009: "RBAC centralized in `core/auth`"). Better
 * Auth owns authentication (the `session`/`user` tables); the `staff_role` table
 * layers authorization on top. These run only in server components / actions /
 * route handlers behind `/admin` — never in public ISR routes.
 */

export type StaffRole = "admin" | "editor" | "translator";

export interface StaffContext {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
}

/** Raw Better Auth session for the current request (or `null` if signed out). */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Resolve the signed-in staff member + their role, or `null` if there is no
 * session or the authenticated user has no `staff_role` row (i.e. authenticated
 * but not staff — denied by default).
 */
export async function getStaff(): Promise<StaffContext | null> {
  const session = await getSession();
  if (!session) return null;

  const [row] = await db
    .select({ role: staff_role.role })
    .from(staff_role)
    .where(eq(staff_role.user_id, session.user.id))
    .limit(1);
  if (!row) return null;

  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: row.role,
  };
}

/**
 * Gate a backoffice route: returns the {@link StaffContext} or redirects.
 * No session / not staff → `/admin/login`; staff but role not in `roles` (when
 * given) → `/admin/forbidden`. Pass `roles` to gate capability-specific screens
 * (e.g. `requireStaff(["admin"])`); omit it to allow any staff member.
 */
export async function requireStaff(roles?: StaffRole[]): Promise<StaffContext> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (roles && !roles.includes(staff.role)) redirect("/admin/forbidden");
  return staff;
}
