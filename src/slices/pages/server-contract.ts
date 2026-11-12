import "server-only";
/** Trusted server composition only; keep out of client-consumed barrels. */
export { readAboutContactAssignment, aboutContactAssignmentGuard, aboutContactUsageGuard } from "./server/about-contact-assignment";
export type { AboutContactAssignment } from "./server/about-contact-assignment";
