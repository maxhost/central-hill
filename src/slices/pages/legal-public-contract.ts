/** Server-only read surface for footer availability, legal routes and metadata. */
export { getLegalPage, listAvailableLegalPages, buildLegalPageMetadata } from "./server/legal-pages";
export { LEGAL_PAGE_KEYS, legalPagePaths, isLegalPageKey } from "./legal-page-content";
export type { LegalPageKey, LegalPageContent } from "./legal-page-content";
export type { PageResult } from "./contract";
