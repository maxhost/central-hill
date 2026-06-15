import "server-only";
import { createHash } from "node:crypto";
import type { Locale } from "@core/db/columns";

/**
 * LLM translation **provider seam** (kernel — `core/i18n`, ADR 0007/0021). The
 * pipeline (slice `translation`, S14) drafts each target locale through this
 * interface, never calling a vendor directly; public pages never reach here at all
 * (translations are read from the `translation` table via `content.ts`).
 *
 * Until a concrete LLM client is wired (`TRANSLATE_API_KEY`), the default provider
 * is a **pass-through identity** stub: it seeds each target draft from the source
 * value so a human reviewer refines it in the backoffice (state `needs_review`).
 * A real provider plugs in behind {@link getTranslateProvider} with no change to
 * callers (ADR 0021 follow-up).
 */

/** Stable content hash of a source value, stored on a target row as `source_hash` */
/** so staleness is a cheap equality check when the source later changes. */
export function hashSource(value: string): string {
  return createHash("sha256").update(value.trim(), "utf8").digest("hex");
}

/** One field's source text to translate. */
export interface TranslateUnit {
  field: string;
  value: string;
}

/** A batch translate request for one entity → one target locale. */
export interface TranslateRequest {
  entityType: string;
  sourceLocale: Locale;
  targetLocale: Locale;
  units: TranslateUnit[];
}

/** One field's translated text (paired back to the request unit by `field`). */
export interface TranslateResult {
  field: string;
  value: string;
}

/** The provider contract every translation backend implements. */
export interface TranslateProvider {
  readonly name: string;
  translate(req: TranslateRequest): Promise<TranslateResult[]>;
}

/** Default backend: echoes the source verbatim (human refines on review). */
const identityProvider: TranslateProvider = {
  name: "identity",
  async translate(req) {
    return req.units.map((u) => ({ field: u.field, value: u.value }));
  },
};

/**
 * Resolve the active translation provider. A concrete LLM client (gated on
 * `TRANSLATE_API_KEY`) is registered here behind the same interface; until then
 * drafts are seeded from source via {@link identityProvider}.
 */
export function getTranslateProvider(): TranslateProvider {
  return identityProvider;
}
