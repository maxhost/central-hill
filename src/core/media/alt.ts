/** Client-safe content-owned image descriptions (ADR0076). Never writes asset metadata. */
import { z } from "zod";

export type MediaAlts = Record<string, string>;
export const mediaAltsSchema = z.record(z.uuid(), z.string().trim().max(500))
  .refine(value => Object.keys(value).length <= 500, "Too many image descriptions.");

/** Old snapshots retain their exact asset/title fallback until an ALT is authored. */
export function resolveMediaAlt(alts: MediaAlts | undefined, id: string | null | undefined, fallback = ""): string {
  return (id && alts?.[id]?.trim()) || fallback;
}
