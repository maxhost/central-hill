import assert from "node:assert/strict";
import { test } from "node:test";
import { type LeadSubmission, leadSubmission } from "../validation";
import { flattenFields } from "../server/fields";
import { buildLeadNotification } from "../server/notify-message";

/**
 * Slice `leads` unit tests (ADR 0011/0014) — the public submission validator
 * (discriminated union per `kind`), the pure `lead_field` KV flattening, and the
 * pure staff-notification builder. No DB, no email runtime. Run:
 * `npx tsx --test src/slices/leads/tests/leads.test.ts`.
 */

type Of<K extends LeadSubmission["kind"]> = Extract<LeadSubmission, { kind: K }>;
const base = { locale: "en", marketing_consent: true, consent_text: "I agree to the Privacy Policy." } as const;

const earnings = (): Of<"earnings_estimate"> => ({
  ...base,
  kind: "earnings_estimate",
  source_page: "owners",
  fields: { property_address: "Rua Garrett 12, Lisboa", num_properties: 2, num_bedrooms: 3 },
});
const contact = (): Of<"contact"> => ({
  ...base,
  kind: "contact",
  source_page: "about",
  fields: { name: "Ana Dias", email: "ana@example.com", subject: "Hello", message: "Get in touch" },
});
const newsletter = (): Of<"newsletter"> => ({
  ...base,
  kind: "newsletter",
  source_page: "blog",
  fields: { email: "ana@example.com" },
});
const deal = (): Of<"deal_enquiry"> => ({
  ...base,
  kind: "deal_enquiry",
  source_page: "real-estate",
  fields: {
    company_name: "Acme Capital",
    contact_name: "John Roe",
    email: "john@acme.com",
    country: "Portugal",
    asset_type: "Aparthotel",
  },
});

// ── validation ───────────────────────────────────────────────────────────────
test("accepts a valid submission of every kind", () => {
  for (const make of [earnings, contact, newsletter, deal]) {
    assert.equal(leadSubmission.safeParse(make()).success, true, make().kind);
  }
});

test("rejects an unknown kind", () => {
  const row = { ...contact(), kind: "feedback" };
  assert.equal(leadSubmission.safeParse(row).success, false);
});

test("rejects a contact submission with a malformed email", () => {
  const row = contact();
  row.fields.email = "not-an-email";
  assert.equal(leadSubmission.safeParse(row).success, false);
});

test("rejects an earnings submission with a non-positive count", () => {
  const row = earnings();
  row.fields.num_properties = 0;
  assert.equal(leadSubmission.safeParse(row).success, false);
});

test("requires a non-empty consent_text", () => {
  const row = { ...contact(), consent_text: "" };
  assert.equal(leadSubmission.safeParse(row).success, false);
});

test("the wrong fields for a kind are rejected (discriminated union)", () => {
  const row = { ...newsletter(), fields: { name: "X" } }; // newsletter wants `email`
  assert.equal(leadSubmission.safeParse(row).success, false);
});

// ── flattenFields → lead_field KV ─────────────────────────────────────────────
test("flattenFields stringifies numbers and keeps required keys", () => {
  const rows = flattenFields(earnings());
  assert.deepEqual(rows, [
    { key: "property_address", value: "Rua Garrett 12, Lisboa" },
    { key: "num_properties", value: "2" },
    { key: "num_bedrooms", value: "3" },
  ]);
});

test("flattenFields drops absent optionals and trims values", () => {
  const row = deal();
  row.fields.company_name = "  Acme Capital  ";
  const rows = flattenFields(row);
  const keys = rows.map((r) => r.key);
  // optional fields (phone, units_count, notes…) were never set → not stored.
  assert.ok(!keys.includes("phone"));
  assert.ok(!keys.includes("units_count"));
  assert.ok(!keys.includes("notes"));
  assert.equal(rows.find((r) => r.key === "company_name")?.value, "Acme Capital");
});

// ── staff notification ────────────────────────────────────────────────────────
test("buildLeadNotification carries kind, source, lead id and field values", () => {
  const msg = buildLeadNotification(contact(), "lead-123", "staff@centralhill.pt");
  assert.equal(msg.to, "staff@centralhill.pt");
  assert.match(msg.subject, /Contact/);
  assert.match(msg.subject, /about/);
  assert.match(msg.text, /lead-123/);
  assert.match(msg.text, /subject: Hello/);
  // reply-to is the lead's own email when present…
  assert.equal(msg.replyTo, "ana@example.com");
});

test("buildLeadNotification has no reply-to when the kind carries no email", () => {
  const msg = buildLeadNotification(earnings(), "lead-9", "staff@centralhill.pt");
  assert.equal(msg.replyTo, undefined);
});
