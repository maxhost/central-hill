import assert from "node:assert/strict";
import test from "node:test";
import { companySettingsSaveInput } from "../admin/validation";
import { EDITABLE_SITE_ICON_KEYS, SITE_ICON_DEFAULTS } from "../site-icons";
import { OFFICE_HOURS_DEFAULT_LABELS } from "../hours-label-types";
import { isSettingsEditorialEntity } from "../manual-locale-fields";
import { rawHoursLabelTranslations, resolveHoursLabel } from "../server/hours-labels";
const row = (locale: "en" | "es" | "pt" | "fr", value: string, state: "draft" | "approved" | "needs_review" = "approved") => ({ locale, field: "office_hours_label", value, state });
test("hours target inputs trim, require full known target map and permit blank EN fallback", () => {
  const schema = companySettingsSaveInput.shape.office_hours_translations;
  assert.equal(schema.parse(undefined), undefined);
  assert.deepEqual(schema.parse({ es: " Horario ", pt: " ", fr: "" }), { es: "Horario", pt: "", fr: "" });
  for (const input of [{ es: "" }, { es: "", pt: "", fr: "", en: "Hours" }, { es: "a".repeat(121), pt: "", fr: "" }]) assert.equal(schema.safeParse(input).success, false);
});
test("admin loads pending labels as authored and leaves missing targets blank", () => {
  assert.deepEqual(rawHoursLabelTranslations([row("en", "Legacy EN"), row("es", "Horario pendiente", "needs_review")]), { es: "Horario pendiente", pt: "", fr: "" });
});
test("public uses owned approved label, then canonical EN, then localized default", () => {
  const rows = [row("en", "Old EN row", "draft"), row("es", "Pendiente", "needs_review"), row("pt", "Horário próprio")];
  assert.equal(resolveHoursLabel("Opening times", "en", rows), "Opening times");
  assert.equal(resolveHoursLabel("Opening times", "es", rows), "Opening times");
  assert.equal(resolveHoursLabel("Opening times", "pt", rows), "Horário próprio");
  assert.equal(resolveHoursLabel(null, "pt", rows), "Horário próprio");
  assert.equal(resolveHoursLabel(null, "es", rows), OFFICE_HOURS_DEFAULT_LABELS.es);
  assert.equal(resolveHoursLabel("Hours", "fr", [row("fr", "a".repeat(121))]), "Hours");
});
test("only active global icon controls remain writable; How slots remain legacy defaults", () => {
  const schema = companySettingsSaveInput.shape.site_icons;
  const parsed = schema.parse({ ...SITE_ICON_DEFAULTS, services_how_1: "invalid-retired-icon" });
  assert.equal("services_how_1" in parsed, false);
  assert.equal(EDITABLE_SITE_ICON_KEYS.includes("account"), true);
  assert.equal(EDITABLE_SITE_ICON_KEYS.includes("service_included"), true);
  assert.equal(schema.safeParse({ ...SITE_ICON_DEFAULTS, account: "invalid-active-icon" }).success, false);
  assert.equal(isSettingsEditorialEntity("company_settings"), true);
  assert.equal(isSettingsEditorialEntity("faq_item"), false);
});
