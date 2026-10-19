import type { EditorialPageKey } from "./editorial-types";
import type { PageKey } from "./schemas";
/** Adapted pages bypass the legacy live/translation publication workflow. */
export function usesPageLocaleDrafts(key: PageKey | string): key is EditorialPageKey {
  return (enabledEditorialPageKeys as readonly string[]).includes(key);
}
export const pageLocaleTag = (key: PageKey, locale: string) => `page:${key}:${locale}`;

export const enabledEditorialPageKeys = ["home", "owners", "buildings", "real_estate", "guest", "services", "about", "guides", "blog"] as const;
export const editorialPageKeys = ["home", "owners", "buildings", "real_estate", "guest", "services", "about", "guides", "blog"] as const;
export function isEditorialPageKey(key: string): key is EditorialPageKey { return (editorialPageKeys as readonly string[]).includes(key); }
