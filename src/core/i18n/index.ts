/**
 * Public surface of the i18n kernel (`core/i18n`). Read side (`content.ts`) +
 * the ADR-0019 write seam (`content-write.ts`). Existing slices import the
 * submodules directly (`@core/i18n/content`, `@core/i18n/schema`); new code may
 * use this barrel. The `translation` / `slug` tables live in `./schema`.
 */
export type { ContentRef, ContentResolver } from "./content";
export { loadContent, resolveSlug, loadSlugs, loadAlternateSlugs, loadAllSlugs } from "./content";

export type { SourceFields } from "./content-write";
export {
  SlugConflictError,
  setSourceContent,
  setSlug,
  setSlugs,
  deleteContent,
  deleteSlugs,
} from "./content-write";
