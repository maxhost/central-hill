import "server-only";
/** Server-only placement surface; never re-export through the client-safe barrel. */
export { listHeaderContactFormOptions, getAssignableHeaderForm, assignableHeaderFormGuard, readHeaderContactForm } from "./server/public-queries";

export { listHeaderContactFormOptions as listContactFormOptions, getAssignableHeaderForm as getAssignableContactForm, assignableHeaderFormGuard as assignableContactFormGuard } from "./server/public-queries";
