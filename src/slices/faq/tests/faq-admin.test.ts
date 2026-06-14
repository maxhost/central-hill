import assert from "node:assert/strict";
import { test } from "node:test";
import { faqGroupSaveInput } from "../admin/validation";

/**
 * Slice `faq` backoffice (S12) — the admin **save** schema (group + inline items).
 * Pure (Zod, no DB). Run: `npx tsx --test src/slices/faq/tests/faq-admin.test.ts`.
 */

const ITEM_ID = "11111111-1111-4111-8111-111111111111";

function validItem(overrides: Record<string, unknown> = {}) {
  return { status: "published", question: "Can I bring pets?", answer: "Yes, on request.", ...overrides };
}

function valid(overrides: Record<string, unknown> = {}) {
  return { key: "owners", position: 0, items: [validItem()], ...overrides };
}

test("accepts a complete, valid group with items", () => {
  assert.equal(faqGroupSaveInput.safeParse(valid()).success, true);
});

test("accepts an empty items array", () => {
  assert.equal(faqGroupSaveInput.safeParse(valid({ items: [] })).success, true);
});

test("key must be kebab-case slug", () => {
  assert.equal(faqGroupSaveInput.safeParse(valid({ key: "Real Estate" })).success, false);
  assert.equal(faqGroupSaveInput.safeParse(valid({ key: "real-estate" })).success, true);
});

test("item question/answer cannot be blank", () => {
  assert.equal(faqGroupSaveInput.safeParse(valid({ items: [validItem({ question: "" })] })).success, false);
  assert.equal(faqGroupSaveInput.safeParse(valid({ items: [validItem({ answer: "" })] })).success, false);
});

test("item id is optional (absent ⇒ insert, present ⇒ update)", () => {
  assert.equal(faqGroupSaveInput.safeParse(valid({ items: [validItem({ id: ITEM_ID })] })).success, true);
});

test("validation surfaces the offending item path", () => {
  const r = faqGroupSaveInput.safeParse(valid({ items: [validItem(), validItem({ question: "" })] }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "items.1.question"));
});
