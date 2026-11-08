import "server-only";
import { deleteTranslation, setSourceContent, setTargetTranslation } from "@core/i18n";
import { ownerMediaAltField, type OwnerMediaAlts } from "./owner-alt";

/** Called only after the owning action's staff gate and payload validation. */
export async function saveOwnerMediaAlts(type: string, id: string, mediaId: string | null, alts?: OwnerMediaAlts, updatedBy?: string): Promise<void> {
  if (!mediaId || !alts) return;
  const field = ownerMediaAltField(mediaId);
  await setSourceContent(type, id, { [field]: alts.en }, { updatedBy, preserveTargetsOnClear: true });
  for (const locale of ["es", "pt", "fr"] as const) {
    const value = alts[locale].trim();
    if (value) await setTargetTranslation(type, id, field, locale, value, { sourceValue: alts.en, state: "approved", updatedBy });
    else await deleteTranslation(type, id, field, locale);
  }
}
