/**
 * Public surface of the i18n kernel (`core/i18n`). Read side (`content.ts`) +
 * the ADR-0019 write seam (`content-write.ts`). Existing slices import the
 * submodules directly (`@core/i18n/content`, `@core/i18n/schema`); new code may
 * use this barrel. The `translation` / `slug` tables live in `./schema`.
 */
export type {
  ContentRef,
  ContentResolver,
  TranslationRow,
  TranslationFilter,
  TranslationState,
} from "./content";
export {
  loadContent,
  resolveSlug,
  loadSlugs,
  loadAlternateSlugs,
  loadAllSlugs,
  loadTranslationRows,
} from "./content";

export type { SourceFields } from "./content-write";
export {
  SlugConflictError,
  setSourceContent,
  setSlug,
  setSlugs,
  deleteContent,
  deleteSlugs,
  setTargetTranslation,
  setTranslationState,
  deleteTranslation,
} from "./content-write";

export type {
  TranslateProvider,
  TranslateRequest,
  TranslateResult,
  TranslateUnit,
} from "./translate";
export { getTranslateProvider, hashSource } from "./translate";
