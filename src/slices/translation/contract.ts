/**
 * Compatibility surface of retired S14 (ADR0077). There is no global inbox,
 * review UI or generation workflow. Locale editing belongs to the owning form;
 * the core i18n table/readers/writers remain in use and are preserved.
 *
 * The resolver is called only after the app route's staff gate. Generation keeps
 * its historical signature solely to reject stale callers before any work.
 */
export { getLegacyTranslationRedirect } from "./server/legacy-redirect";
export { generateDrafts } from "./server/generate";
export type { GenerateOptions, GenerateSummary } from "./server/generate";
