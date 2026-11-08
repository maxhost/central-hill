import assert from "node:assert/strict";
import test from "node:test";
import { companySettingsSaveInput } from "../admin/validation";
import { isNavigationCtaUrl, navigationCtasByLocaleSchema, navigationCtaHref } from "../navigation-cta-types";
import { isSettingsManualLocaleField } from "../manual-locale-fields";
const en = { book: { label: "Book now", url: "https://booking.example.invalid/en" }, earn: { label: "Earn with us" } };
const blank = { book: { label: "", url: "" }, earn: { label: "" } };
const input = () => structuredClone({ en, es: blank, pt: blank, fr: blank });
test("old clients may omit CTAs; new payload requires all four known language objects", () => {
  assert.equal(companySettingsSaveInput.shape.navigation_ctas.parse(undefined), undefined);
  assert.deepEqual(navigationCtasByLocaleSchema.parse(input()), input());
  assert.equal(navigationCtasByLocaleSchema.safeParse({ en }).success, false);
  assert.equal(navigationCtasByLocaleSchema.safeParse({ ...input(), de: blank }).success, false);
});
test("Book has label and destination, Earn has only label and rejects attempts to change its link", () => {
  assert.equal(navigationCtasByLocaleSchema.safeParse({ ...input(), en: { ...en, earn: { label: "Earn", url: "/elsewhere" } } }).success, false);
  assert.equal(navigationCtasByLocaleSchema.safeParse({ ...input(), es: { ...blank, earn: { label: "Propietarios", url: "/other" } } }).success, false);
  for (const value of ["", "x".repeat(81)]) assert.equal(navigationCtasByLocaleSchema.safeParse({ ...input(), en: { ...en, earn: { label: value } } }).success, false);
});
test("target blanks fall back per field, with trimmed values and required English fields", () => {
  const value = input(); value.es = { book: { label: " Reservar ", url: "  " }, earn: { label: "  " } };
  assert.deepEqual(navigationCtasByLocaleSchema.parse(value).es, { book: { label: "Reservar", url: "" }, earn: { label: "" } });
  assert.equal(navigationCtasByLocaleSchema.safeParse({ ...value, en: blank }).success, false);
});
test("destinations permit HTTPS or safe internal paths and reject unsafe or overlong values", () => {
  for (const value of ["https://booking.example.invalid/es?q=1#dates", "/owners", "/es/owners#start", "/"]) assert.equal(isNavigationCtaUrl(value), true, value);
  for (const value of ["javascript:alert(1)", "data:text/html,test", "http://booking.example.invalid", "//evil.example.invalid", "/\\evil.example.invalid", "\\evil", "/\nevil", "relative", "#dates", "https://example.invalid/" + "a".repeat(301)]) assert.equal(isNavigationCtaUrl(value), false, value);
});
test("internal booking paths use current locale while authored absolute or localized paths stay exact", () => {
  for (const locale of ["en", "es", "pt", "fr"]) {
    assert.equal(navigationCtaHref("/book?source=top#dates", locale), `/${locale}/book?source=top#dates`);
    assert.equal(navigationCtaHref("/", locale), `/${locale}`);
    assert.equal(navigationCtaHref("/es/book", locale), "/es/book");
    assert.equal(navigationCtaHref(en.book.url, locale), en.book.url);
  }
  assert.equal(isSettingsManualLocaleField("company_settings", "navigation_ctas"), true);
  assert.equal(isSettingsManualLocaleField("company_settings", "website_url"), true);
  assert.equal(isSettingsManualLocaleField("company_settings", "office_hours_label"), false);
  assert.equal(isSettingsManualLocaleField("nav_item", "label"), false);
});
