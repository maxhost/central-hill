import { isSettingsWebsiteField } from "./website-locale-types";
import { isSettingsNavigationCtaField } from "./navigation-cta-types";

/** Fields manually authored in Settings, protected from generic Translation writes. */
export function isSettingsManualLocaleField(type: string, field: string): boolean {
  return isSettingsWebsiteField(type, field) || isSettingsNavigationCtaField(type, field);
}

/** All remaining Settings text is manually owned here; old stat fields are retired. */
export function isSettingsEditorialEntity(type: string): boolean {
  return type === "company_settings";
}
