import "server-only";
/** Trusted server composition only; keep out of client-consumed barrels. */
export { readAboutContactAssignment, aboutContactAssignmentGuard, aboutContactUsageGuard } from "./server/about-contact-assignment";
export type { AboutContactAssignment } from "./server/about-contact-assignment";

export { readGuestContactAssignment, guestContactAssignmentGuard, guestContactUsageGuard } from "./server/guest-contact-assignment";
export type { GuestContactAssignment } from "./server/guest-contact-assignment";

export { readRealEstateEnquiryAssignment, realEstateEnquiryAssignmentGuard, realEstateEnquiryUsageGuard } from "./server/real-estate-enquiry-assignment";
export type { RealEstateEnquiryAssignment } from "./server/real-estate-enquiry-assignment";
