import "server-only";
import {
  deleteTranslation,
  setSourceContent,
  setTargetTranslation,
} from "@core/i18n";
import { AMENITY } from "../contract";
import { AMENITY_TARGET_LOCALES } from "../amenity-types";
import type { AmenitySaveInput } from "../admin/validation";

/** Staff-gated callers validate first; existing taxonomy writes remain sequential. */
export async function saveAmenityLabels(
  id: string,
  input: Pick<AmenitySaveInput, "label" | "translations">,
  updatedBy?: string,
): Promise<void> {
  await setSourceContent(AMENITY, id, { label: input.label }, { updatedBy });
  // Older clients author only EN and must not clear translations they never saw.
  if (!input.translations) return;
  for (const locale of AMENITY_TARGET_LOCALES) {
    const value = input.translations[locale].trim();
    if (value)
      await setTargetTranslation(AMENITY, id, "label", locale, value, {
        sourceValue: input.label,
        state: "approved",
        updatedBy,
      });
    else await deleteTranslation(AMENITY, id, "label", locale);
  }
}
