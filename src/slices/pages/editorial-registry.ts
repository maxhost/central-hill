import type { PageKey } from "./schemas";
/** Adapted pages bypass the legacy live/translation publication workflow. */
export function usesPageLocaleDrafts(key: PageKey | string): key is "home" {
  return key === "home";
}
export const pageLocaleTag = (key: PageKey, locale: string) => `page:${key}:${locale}`;
