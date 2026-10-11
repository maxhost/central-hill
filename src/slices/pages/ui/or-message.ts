/**
 * Optional-copy fallback (spec `home-admin-editor`, rule D1). A page field left blank — empty,
 * whitespace-only, or absent on a row saved before the field existed — renders the current
 * i18n message of the visitor's locale; a filled field renders its own text (the overlay
 * already resolved it for the locale, falling back to the EN source).
 *
 * Pure (no React / next-intl) so the tests and the metadata builder can share it.
 */
export function orMessage(value: string | null | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}
