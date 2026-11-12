import "server-only";
/** Server-only placement authority; never export through a client component barrel. */
export { readServiceEnquiryAssignment, serviceEnquiryAssignmentGuard, serviceEnquiryUsageGuard, serviceEnquiryPaths } from "./server/enquiry-assignment";
export { SERVICE_TAGS } from "./contract";
