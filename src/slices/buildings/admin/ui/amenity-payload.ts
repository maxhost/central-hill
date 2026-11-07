/**
 * Pure mapping from the amenity form's text controls to the `saveAmenity` post shape
 * (`amenitySaveInput`): trims everything, and sends `null` for a blank icon (the
 * building page then draws `check-circle`) or a blank group. Kept apart from the
 * client component so it is unit-testable under `tsx --test`.
 */
import { AMENITY_TARGET_LOCALES, type AmenityTranslations } from "../../amenity-types";

export interface AmenityFormValues {
  slug: string;
  icon: string;
  group: string;
  label: string;
  translations: AmenityTranslations;
}

export function amenityPayload(values: AmenityFormValues, id: string | undefined) {
  const orNull = (v: string) => {
    const s = v.trim();
    return s === "" ? null : s;
  };
  return {
    id,
    slug: values.slug.trim(),
    icon: orNull(values.icon),
    group: orNull(values.group),
    label: values.label.trim(),
    translations: Object.fromEntries(
      AMENITY_TARGET_LOCALES.map((locale) => [locale, values.translations[locale].trim()]),
    ) as AmenityTranslations,
  };
}
