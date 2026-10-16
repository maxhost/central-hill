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
    checkin_phone: "+351 912 310 632",
    website_url: "https://www.centralhill.pt",
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

// ── Check-in phone + website (spec about-admin-editor S3) ──────────────────────
test("check-in phone: valid, blank (null) or rejected like the bookings phone", () => {
  const parse = (v: unknown) => companySettingsSaveInput.safeParse(validGlobals({ checkin_phone: v }));
  assert.equal(parse("+351 912 310 632").success, true);
  assert.equal(parse(null).success, true, "blank → null hides the About row");
  assert.equal(parse("12").success, false, "min 3, like phone");
  assert.equal(parse("1".repeat(41)).success, false, "max 40, like phone");
  // Same rule as `phone`.
  for (const v of ["12", "1".repeat(41), "+351 912 310 632"]) {
    assert.equal(parse(v).success, companySettingsSaveInput.safeParse(validGlobals({ phone: v })).success, v);
  }
  const missing: Record<string, unknown> = validGlobals();
  delete missing.checkin_phone;
  assert.equal(companySettingsSaveInput.safeParse(missing).success, false, "the form always posts it");
});

test("website: an https:// URL or blank (null); other values are rejected", () => {
  const parse = (v: unknown) => companySettingsSaveInput.safeParse(validGlobals({ website_url: v }));
  assert.equal(parse("https://www.centralhill.pt").success, true);
  assert.equal(parse("https://www.centralhill.pt/en/").success, true);
  assert.equal(parse(null).success, true, "blank → null hides the About row");
  for (const bad of ["www.centralhill.pt", "http://www.centralhill.pt", "ftp://centralhill.pt", "not a url", ""]) {
    const r = parse(bad);
    assert.equal(r.success, false, bad);
    if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "website_url"), bad);
  }
});
