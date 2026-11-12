import "server-only";
/** Server-only placement surface; never re-export through the client-safe barrel. */
export { listHeaderContactFormOptions, getAssignableHeaderForm, assignableHeaderFormGuard, readHeaderContactForm } from "./server/public-queries";
