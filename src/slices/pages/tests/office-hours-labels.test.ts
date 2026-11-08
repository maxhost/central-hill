import assert from "node:assert/strict";
import test from "node:test";
import { OFFICE_HOURS_DEFAULT_LABELS, OFFICE_HOURS_DEFAULT_VALUES } from "@slices/settings/contract";
import { officeRows } from "../ui/about-office";
const labels = { address: "Address", bookings: "Bookings", checkin: "Check-in", email: "Email", website: "Website" };
test("About uses localized default hours label/day names with the same numeric schedule", () => {
  for (const locale of ["en", "es", "pt", "fr"] as const) {
    const hours = officeRows(null, labels, locale).find(row => row.key === "hours");
    assert.equal(hours?.label, OFFICE_HOURS_DEFAULT_LABELS[locale]);
    assert.equal(hours?.text, OFFICE_HOURS_DEFAULT_VALUES[locale]);
    assert.ok(hours?.text.endsWith("09:30 – 18:00"));
  }
});
test("authored shared hours and resolved labels retain exact content in every locale", () => {
  const globals = { officeAddress: "Office", phone: "+123456", checkinPhone: null, email: "test@example.invalid", website: null, officeHours: "09:00–17:00 · appointment only", officeHoursLabel: "Custom label" };
  for (const locale of ["en", "es", "pt", "fr"] as const) assert.deepEqual(officeRows(globals, labels, locale).find(row => row.key === "hours"), { key: "hours", label: "Custom label", text: globals.officeHours });
  assert.deepEqual(officeRows(null, labels), officeRows(null, labels, "en"));
});
