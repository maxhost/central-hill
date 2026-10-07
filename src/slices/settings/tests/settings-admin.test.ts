import assert from "node:assert/strict";
import { test } from "node:test";
import { companySettingsSaveInput, navigationSaveInput } from "../admin/validation";
import { SITE_ICON_DEFAULTS } from "../site-icons";
import { resolveSiteIcons } from "../server/site-icons";

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
    show_building_location: false,
    show_building_count: false,
    site_icons: { ...SITE_ICON_DEFAULTS },
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

// ── Site icons (ADR 0034 amendment 2) ──────────────────────────────────────────
test("site icons must all be real Iconoir names", () => {
  const icons = (patch: Record<string, string>) => validGlobals({ site_icons: { ...SITE_ICON_DEFAULTS, ...patch } });
  assert.equal(companySettingsSaveInput.safeParse(icons({ account: "user-circle" })).success, true);
  const bad = companySettingsSaveInput.safeParse(icons({ spec_beds: "chart" }));
  assert.equal(bad.success, false);
  if (!bad.success) assert.ok(bad.error.issues.some((i) => i.path.join(".") === "site_icons.spec_beds"));
  const missing: Record<string, string> = { ...SITE_ICON_DEFAULTS };
  delete missing.account;
  assert.equal(companySettingsSaveInput.safeParse(validGlobals({ site_icons: missing })).success, false);
});

test("stored site icons fall back to the defaults when missing or unknown", () => {
  assert.deepEqual(resolveSiteIcons({}), SITE_ICON_DEFAULTS);
  assert.deepEqual(resolveSiteIcons(null), SITE_ICON_DEFAULTS);
  const r = resolveSiteIcons({ location: "pin", reading_time: "chart", extra: "star" });
  assert.equal(r.location, "pin");
  assert.equal(r.reading_time, SITE_ICON_DEFAULTS.reading_time);
  assert.equal("extra" in r, false);
});
