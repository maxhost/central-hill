import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveLeadTitle,
  groupFields,
  LEAD_KINDS,
  LEAD_TITLE_KEYS,
  NO_TITLE,
  statusTone,
} from "../admin/derive";

/**
 * Slice `leads` backoffice (S12) unit tests — the pure inbox presentation helpers
 * in `admin/derive.ts`. No DB / `server-only`, so they run under `tsx --test`. The
 * queries/actions/UI are integration-covered by typecheck + build. Run:
 * `npx tsx --test src/slices/leads/tests/leads-admin.test.ts`.
 */

test("deriveLeadTitle prefers contact_name, then falls back by priority", () => {
  assert.equal(deriveLeadTitle({ contact_name: "Ana", company_name: "Acme", email: "a@x.pt" }), "Ana");
  assert.equal(deriveLeadTitle({ company_name: "Acme", email: "a@x.pt" }), "Acme");
  assert.equal(deriveLeadTitle({ property_address: "Rua 12", email: "a@x.pt" }), "Rua 12");
  assert.equal(deriveLeadTitle({ email: "a@x.pt" }), "a@x.pt");
  assert.equal(deriveLeadTitle({}), NO_TITLE);
});

test("deriveLeadTitle uses name (contact form) over email", () => {
  assert.equal(deriveLeadTitle({ name: "João", email: "j@x.pt" }), "João");
});

test("LEAD_TITLE_KEYS priority order is stable", () => {
  assert.deepEqual([...LEAD_TITLE_KEYS], [
    "contact_name",
    "name",
    "company_name",
    "property_address",
    "email",
  ]);
});

test("groupFields buckets per lead and drops null/empty values", () => {
  const grouped = groupFields([
    { lead_id: "a", key: "name", value: "Ana" },
    { lead_id: "a", key: "email", value: "a@x.pt" },
    { lead_id: "a", key: "phone", value: null },
    { lead_id: "a", key: "notes", value: "" },
    { lead_id: "b", key: "email", value: "b@x.pt" },
  ]);
  assert.deepEqual(grouped.get("a"), { name: "Ana", email: "a@x.pt" });
  assert.deepEqual(grouped.get("b"), { email: "b@x.pt" });
  assert.equal(grouped.size, 2);
});

test("groupFields: later rows win on key clash", () => {
  const grouped = groupFields([
    { lead_id: "a", key: "email", value: "old@x.pt" },
    { lead_id: "a", key: "email", value: "new@x.pt" },
  ]);
  assert.equal(grouped.get("a")?.email, "new@x.pt");
});

test("statusTone maps each lead status", () => {
  assert.equal(statusTone("new"), "accent");
  assert.equal(statusTone("in_progress"), "review");
  assert.equal(statusTone("closed"), "neutral");
});

test("LEAD_KINDS covers all four kinds", () => {
  assert.deepEqual([...LEAD_KINDS].sort(), [
    "contact",
    "deal_enquiry",
    "earnings_estimate",
    "newsletter",
  ]);
});
