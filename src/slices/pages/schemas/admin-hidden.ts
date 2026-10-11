/**
 * "Hidden in the editor" field metadata (spec owners-admin-editor → "Campos ocultos en el
 * editor"). Kept dependency-free (zod is a type-only import), like `media-accept.ts`, so the
 * client-side form-model can import it.
 *
 * A field tagged `.meta({ admin_hidden: true })` (use `adminHidden`) is **not rendered** by the
 * page editor, but it keeps its value: the stored value travels in the form state untouched
 * and is saved back unchanged, so a required hidden field (e.g. a CTA `url`) still validates.
 * Used for values the system decides (button URLs) or that the page never shows.
 */
import type { z } from "zod";

/** The `.meta()` key the flag lives under (namespaced: it shares zod's global registry). */
export const ADMIN_HIDDEN_META_KEY = "admin_hidden";

/** Tag a field schema as hidden in the page editor (value preserved on save). */
export function adminHidden<T extends z.ZodType>(schema: T): T {
  return schema.meta({ [ADMIN_HIDDEN_META_KEY]: true }) as T;
}
