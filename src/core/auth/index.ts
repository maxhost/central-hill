/**
 * Public surface of the auth kernel (`core/auth`, ADR 0009). Server-side only:
 * the Better Auth instance + RBAC helpers. Browser code imports the React client
 * from `@core/auth/client` instead (this barrel pulls in `server-only`).
 */
export { auth } from "./auth";
export { getSession, getStaff, requireStaff } from "./session";
export type { StaffRole, StaffContext } from "./session";
