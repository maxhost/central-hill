import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { faqGroupInput, faqItemInput } from "../validation";

/**
 * Slice `faq` unit tests — input validation (group, item) + the translatable-field
 * contract the translation pipeline relies on (ADR 0006). Pure, no DB.
 * Run: `npx tsx --test src/slices/faq/tests/faq.test.ts`.
 */

const GROUP_ID = "44444444-4444-4444-8444-444444444444";

const validItem = {
  group_id: GROUP_ID,
  position: 0,
  status: "published",
  question: "How do you handle short-term-rental licensing?",
  answer: "We manage the full Alojamento Local licensing process on your behalf.",
} as const;

// ── faq_group ────────────────────────────────────────────────────────────────
test("accepts a valid faq group key", () => {
  assert.equal(faqGroupInput.safeParse({ key: "owners", position: 0 }).success, true);
  assert.equal(faqGroupInput.safeParse({ key: "real-estate", position: 1 }).success, true);
});

test("rejects a non-kebab-case group key", () => {
  assert.equal(faqGroupInput.safeParse({ key: "Real Estate", position: 0 }).success, false);
});

// ── faq_item ─────────────────────────────────────────────────────────────────
test("accepts a valid faq item", () => {
  assert.equal(faqItemInput.safeParse(validItem).success, true);
});

test("rejects an unknown status", () => {
  assert.equal(faqItemInput.safeParse({ ...validItem, status: "live" }).success, false);
});

test("rejects a question over the max length", () => {
  assert.equal(faqItemInput.safeParse({ ...validItem, question: "q".repeat(301) }).success, false);
});

test("rejects a non-uuid group_id", () => {
  assert.equal(faqItemInput.safeParse({ ...validItem, group_id: "owners" }).success, false);
});

// ── translatable-field contract ──────────────────────────────────────────────
test("faq item exposes exactly question + answer as translatable", () => {
  assert.deepEqual(translatablePaths(faqItemInput).sort(), ["answer", "question"]);
});

test("faq group has no translatable fields", () => {
  assert.deepEqual(translatablePaths(faqGroupInput), []);
});
