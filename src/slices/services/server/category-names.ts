import "server-only";
import {
  deleteTranslation,
  setSourceContent,
  setTargetTranslation,
} from "@core/i18n";
import type { ServiceCategorySaveInput } from "../admin/validation";
import { SERVICE_TARGET_LOCALES } from "../editorial-types";
export async function saveServiceCategoryNames(
  id: string,
  input: Pick<ServiceCategorySaveInput, "name" | "translations">,
  updatedBy?: string,
): Promise<void> {
  await setSourceContent(
    "service_category",
    id,
    { name: input.name },
    { updatedBy },
  );
  if (!input.translations) return;
  for (const locale of SERVICE_TARGET_LOCALES) {
    const value = input.translations[locale].trim();
    if (value)
      await setTargetTranslation(
        "service_category",
        id,
        "name",
        locale,
        value,
        { sourceValue: input.name, state: "approved", updatedBy },
      );
    else await deleteTranslation("service_category", id, "name", locale);
  }
}
