/**
 * Public contract of slice `translation` (S14 — the LLM-draft → review → approve
 * pipeline, ADR 0007/0021). The ONLY surface other slices/app may import.
 *
 * The slice owns **no tables** (it operates on the kernel `translation` table
 * generically by `entity_type`, through the `core/i18n` seam) and **no migration**.
 *
 * What others use:
 *  - **`translationAdminScreens`** — spread into `composeAdminNav` by the admin
 *    panel layout to add the review inbox to the sidebar (`translation` group).
 *    Pure data, safe to import anywhere.
 *  - **`generateDrafts(type, id, opts?)`** — (re)generate target-locale drafts for
 *    an entity through the provider seam. Used by the review screen's "Generate"
 *    action; available for content slices to optionally call from `publish()` on
 *    source save (a future, additive wiring — see README).
 *
 * The inbox/review screens mount under `app/(admin)/admin/(panel)/translations/…`.
 */

export { translationAdminScreens } from "./admin/screens";

export { generateDrafts } from "./server/generate";
export type { GenerateOptions, GenerateSummary } from "./server/generate";
