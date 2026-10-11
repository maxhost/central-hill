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

/**
 * A label template that names one item (spec `owners-admin-editor` S2: the plan button,
 * "Choose {name}"). A filled field gets every `{name}` replaced by `name` (plain text, not
 * ICU); a blank one renders `fallback(name)` — the caller's ICU i18n message, e.g.
 * `(name) => t("owners.choosePlan", { name })`.
 */
export function orNamedMessage(
  value: string | null | undefined,
  name: string,
  fallback: (name: string) => string,
): string {
  return typeof value === "string" && value.trim() !== ""
    ? value.replaceAll("{name}", name)
    : fallback(name);
}
