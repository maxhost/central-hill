import { isSettingsWebsiteField } from "./website-locale-types";
import { isSettingsNavigationCtaField } from "./navigation-cta-types";

/** Fields manually authored in Settings, protected from generic Translation writes. */
export function isSettingsManualLocaleField(type: string, field: string): boolean {
  return isSettingsWebsiteField(type, field) || isSettingsNavigationCtaField(type, field);
}
