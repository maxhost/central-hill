import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { companySettingsInput, navItemInput } from "../validation";

/**
 * Slice `settings` / `globals` unit tests — input validation for the site-wide
 * singleton + navigation, plus the translatable-field contract the translation
 * pipeline relies on (ADR 0006). Pure, no DB.
 * Run: `npx tsx --test src/slices/settings/tests/settings.test.ts`.
 */

const MEDIA_ID = "33333333-3333-4333-8333-333333333333";

const validStats = {
  bookings: { value: "60,000+", label: "Bookings Completed" },
  years: { value: "12+", label: "Years of Experience" },
  guests: { value: "700,000+", label: "Guests Hosted" },
  revenue: { value: "€55M+", label: "Revenue Generated" },
  buildings: { value: "15+", label: "Buildings" },
  apartments: { value: "120+", label: "Apartments" },
};

// ── company_settings ───────────────────────────────────────────────────────────
test("accepts valid company settings and defaults currency to EUR", () => {
  const result = companySettingsInput.safeParse({
    email: "info@centralhill.pt",
    phone: "+351 910 075 725",
    whatsapp: "+351 910 075 725",
    stats: validStats,
    office_address: "Lisbon, Portugal",
    avantio_account_id: "ch-lisbon",
  });
  assert.equal(result.success, true);
  assert.equal(result.success && result.data.currency, "EUR");
  assert.deepEqual(result.success ? result.data.social : null, {});
});

test("rejects an invalid contact email", () => {
  const result = companySettingsInput.safeParse({
    email: "not-an-email",
    phone: "+351 910 075 725",
    stats: validStats,
    office_address: "Lisbon, Portugal",
    avantio_account_id: "ch-lisbon",
  });
  assert.equal(result.success, false);
});

test("requires all six headline stats", () => {
  const partial = {
    bookings: validStats.bookings,
    guests: validStats.guests,
    revenue: validStats.revenue,
    buildings: validStats.buildings,
    apartments: validStats.apartments,
  }; // `years` intentionally omitted
  const result = companySettingsInput.safeParse({
    email: "info@centralhill.pt",
    phone: "+351 910 075 725",
    stats: partial,
    office_address: "Lisbon, Portugal",
    avantio_account_id: "ch-lisbon",
  });
  assert.equal(result.success, false);
});

test("accepts an optional default OG image as a media id", () => {
  const result = companySettingsInput.safeParse({
    email: "info@centralhill.pt",
    phone: "+351 910 075 725",
    stats: validStats,
    office_address: "Lisbon, Portugal",
    avantio_account_id: "ch-lisbon",
    default_og_image_media_id: MEDIA_ID,
  });
  assert.equal(result.success, true);
});

// ── nav_item ─────────────────────────────────────────────────────────────────
test("accepts a top-level header nav item (parent optional)", () => {
  const result = navItemInput.safeParse({
    location: "header",
    position: 0,
    url: "/buildings",
    label: "Buildings",
  });
  assert.equal(result.success, true);
});

test("rejects a nav item with an unknown location", () => {
  const result = navItemInput.safeParse({
    location: "sidebar",
    position: 0,
    url: "/buildings",
    label: "Buildings",
  });
  assert.equal(result.success, false);
});

// ── translatable-field contract ──────────────────────────────────────────────
test("company settings expose exactly their [T] leaf paths", () => {
  assert.deepEqual(translatablePaths(companySettingsInput).sort(), [
    "office_hours_label",
    "stats.apartments.label",
    "stats.bookings.label",
    "stats.buildings.label",
    "stats.guests.label",
    "stats.revenue.label",
    "stats.years.label",
  ]);
});

test("nav item exposes only its label", () => {
  assert.deepEqual(translatablePaths(navItemInput), ["label"]);
});
