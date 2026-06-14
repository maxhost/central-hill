import assert from "node:assert/strict";
import { test } from "node:test";
import { companySettingsSaveInput, navigationSaveInput } from "../admin/validation";

/**
 * Slice `settings` backoffice (S12) — the admin **save** schemas (company globals +
 * navigation). Pure (Zod, no DB). Run:
 * `npx tsx --test src/slices/settings/tests/settings-admin.test.ts`.
 */

const NAV_ID = "11111111-1111-4111-8111-111111111111";
const OG = "22222222-2222-4222-8222-222222222222";

function stat(label = "Bookings", value = "60,000+") {
  return { value, label };
}

function validGlobals(overrides: Record<string, unknown> = {}) {
  return {
    email: "info@centralhill.pt",
    phone: "+351 910 075 725",
    whatsapp: null,
    social: { instagram: null, facebook: null, linkedin: null, youtube: null, tiktok: null },
    stats: {
      bookings: stat("Bookings"),
      years: stat("Years", "12+"),
      guests: stat("Guests", "700,000+"),
      revenue: stat("Revenue", "€55M+"),
      buildings: stat("Buildings", ""),
      apartments: stat("Apartments", ""),
    },
    office_address: "Lisbon, Portugal",
    office_hours: null,
    office_hours_label: null,
    currency: "EUR",
    default_og_image_media_id: null,
    avantio_account_id: "ch-001",
    avantio_widget_config: {},
    ...overrides,
  };
}

test("accepts complete, valid globals", () => {
  assert.equal(companySettingsSaveInput.safeParse(validGlobals()).success, true);
});

test("stat value may be empty but label is required", () => {
  assert.equal(
    companySettingsSaveInput.safeParse(
      validGlobals({ stats: { ...validGlobals().stats, buildings: stat("", "") } }),
    ).success,
    false,
  );
});

test("email + currency are validated", () => {
  assert.equal(companySettingsSaveInput.safeParse(validGlobals({ email: "nope" })).success, false);
  assert.equal(companySettingsSaveInput.safeParse(validGlobals({ currency: "USD" })).success, false);
});

test("social handles must be URLs when present", () => {
  assert.equal(
    companySettingsSaveInput.safeParse(
      validGlobals({ social: { instagram: "not-a-url", facebook: null, linkedin: null, youtube: null, tiktok: null } }),
    ).success,
    false,
  );
  assert.equal(
    companySettingsSaveInput.safeParse(
      validGlobals({ social: { instagram: "https://instagram.com/centralhill", facebook: null, linkedin: null, youtube: null, tiktok: null } }),
    ).success,
    true,
  );
});

test("og image accepts a uuid or null", () => {
  assert.equal(companySettingsSaveInput.safeParse(validGlobals({ default_og_image_media_id: OG })).success, true);
  assert.equal(companySettingsSaveInput.safeParse(validGlobals({ default_og_image_media_id: "x" })).success, false);
});

test("navigation accepts nested header/footer trees", () => {
  const r = navigationSaveInput.safeParse({
    header: [{ id: NAV_ID, url: "/owners", label: "Owners", children: [{ url: "/owners#fees", label: "Fees" }] }],
    footer: [{ url: "/about", label: "About", children: [] }],
  });
  assert.equal(r.success, true);
});

test("navigation rejects a blank label or url", () => {
  assert.equal(
    navigationSaveInput.safeParse({ header: [{ url: "", label: "X", children: [] }], footer: [] }).success,
    false,
  );
  assert.equal(
    navigationSaveInput.safeParse({ header: [{ url: "/x", label: "", children: [] }], footer: [] }).success,
    false,
  );
});

test("navigation accepts empty locations", () => {
  assert.equal(navigationSaveInput.safeParse({ header: [], footer: [] }).success, true);
});
