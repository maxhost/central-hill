import type { EditorialPageKey } from "./editorial-types";
import type { PageKey } from "./schemas";
/** Adapted pages bypass the legacy live/translation publication workflow. */
export function usesPageLocaleDrafts(key: PageKey | string): key is EditorialPageKey {
  return key === "home" || key === "owners";
}
export const pageLocaleTag = (key: PageKey, locale: string) => `page:${key}:${locale}`;

export const editorialPageKeys = ["home", "owners", "buildings", "real_estate", "guest"] as const;
export function isEditorialPageKey(key: string): key is EditorialPageKey { return (editorialPageKeys as readonly string[]).includes(key); }
