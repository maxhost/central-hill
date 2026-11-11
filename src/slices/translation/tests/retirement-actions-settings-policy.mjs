// Query-only policy imports avoid loading unrelated Settings UI in Node DB tests.
export { isSettingsEditorialEntity, isSettingsManualLocaleField } from "../../settings/manual-locale-fields.ts";
export { isFixedNavigationEntity } from "../../settings/fixed-navigation.ts";
