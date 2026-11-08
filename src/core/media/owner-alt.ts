/** Client-safe ALT contract for existing forms without language tabs (ADR0076). */
import { z } from "zod";
import type { Locale } from "@core/db/columns";

export const OWNER_ALT_LOCALES = ["en", "es", "pt", "fr"] as const;
const text = z.string().trim().max(500);
export const ownerMediaAltsSchema = z.strictObject({ en: text, es: text, pt: text, fr: text });
export type OwnerMediaAlts = z.infer<typeof ownerMediaAltsSchema>;
type AltRow = { locale: Locale; field: string; value: string; state?: string };
export const ownerMediaAltField = (mediaId: string) => `image_alt:${mediaId}`;

/** Raw pending/authored values for the selected asset; no invented EN copies. */
export function rawOwnerMediaAlts(rows: readonly AltRow[], mediaId: string | null | undefined): OwnerMediaAlts {
  return Object.fromEntries(OWNER_ALT_LOCALES.map(locale => [locale,
    mediaId ? rows.find(row => row.locale === locale && row.field === ownerMediaAltField(mediaId))?.value ?? "" : "",
  ])) as OwnerMediaAlts;
}

export function resolveOwnerMediaAlt(rows: readonly AltRow[], mediaId: string | null | undefined, locale: Locale, fallback = ""): string {
  if (!mediaId) return fallback;
  const field = ownerMediaAltField(mediaId);
  const english = rows.find(row => row.locale === "en" && row.field === field)?.value.trim();
  const own = locale === "en" ? english : rows.find(row => row.locale === locale && row.field === field && row.state === "approved")?.value.trim();
  return own || english || fallback;
}
