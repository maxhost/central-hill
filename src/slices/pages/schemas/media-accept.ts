/**
 * Media-field `accept` metadata (spec home-admin-editor, S1). Kept dependency-free (zod is
 * a type-only import) so the client-side form-model can import it without dragging the
 * page schemas' dependencies (icon catalogue, primitives) into the admin bundle.
 */
import type { z } from "zod";

/**
 * What a media field's admin picker accepts. Declared on the field schema through
 * `.meta({ media_accept })` (use `withMediaAccept`); the form-model reads it into the
 * `media` node and the editor passes it to the backoffice `MediaField` as `accept`. No
 * metadata → `"image"`. To add a kind (e.g. `"animated"` in S6), extend this tuple **and**
 * the `MediaField` accept map in slice `backoffice` together.
 */
export const MEDIA_ACCEPTS = ["image", "video"] as const;
export type MediaAccept = (typeof MEDIA_ACCEPTS)[number];

/** The `.meta()` key the accept lives under (namespaced: it shares zod's global registry). */
export const MEDIA_ACCEPT_META_KEY = "media_accept";

/** Tag a media schema with what its picker accepts. Metadata survives later `.describe()`. */
export function withMediaAccept<T extends z.ZodType>(schema: T, accept: MediaAccept): T {
  return schema.meta({ [MEDIA_ACCEPT_META_KEY]: accept }) as T;
}
