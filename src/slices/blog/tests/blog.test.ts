import assert from "node:assert/strict";
import { test } from "node:test";
import { postBody } from "../body";
import { ALL_CATEGORIES, hasMoreItems, isFilterItemHidden } from "../ui/components/category-filter-logic";

/**
 * Slice `blog` unit tests — the portable-JSON body block set (ADR 0013). Pure,
 * no DB. Run: `npx tsx --test src/slices/blog/tests/blog.test.ts`.
 */
test("accepts a valid body with one of every block type", () => {
  const result = postBody.safeParse([
    { type: "heading", level: 2, number: "01", text: "Introduction" },
    { type: "paragraph", text: "A premium furnished rental in Lisbon." },
    { type: "list", ordered: false, items: ["Central", "Furnished", "Flexible"] },
    { type: "image", media_id: "11111111-1111-4111-8111-111111111111", caption: "View" },
    { type: "quote", text: "Worth every escudo.", attribution: "A happy owner" },
    { type: "callout", variant: "tip", body: "Book early in summer." },
    { type: "divider" },
    { type: "cta", label: "List your property", url: "https://centralhill.pt/owners" },
  ]);
  assert.equal(result.success, true);
});

test("rejects an unknown block type", () => {
  const result = postBody.safeParse([{ type: "video", src: "x" }]);
  assert.equal(result.success, false);
});

test("rejects a heading level outside 2..4", () => {
  assert.equal(postBody.safeParse([{ type: "heading", level: 1, text: "x" }]).success, false);
  assert.equal(postBody.safeParse([{ type: "heading", level: 5, text: "x" }]).success, false);
});

test("rejects a cta with a non-url target", () => {
  const result = postBody.safeParse([{ type: "cta", label: "Go", url: "not-a-url" }]);
  assert.equal(result.success, false);
});

test("image block requires a uuid media_id (never a raw url)", () => {
  const ok = postBody.safeParse([
    { type: "image", media_id: "22222222-2222-4222-9222-222222222222" },
  ]);
  assert.equal(ok.success, true);
  const bad = postBody.safeParse([{ type: "image", media_id: "https://example.com/x.jpg" }]);
  assert.equal(bad.success, false);
});

test("rejects an empty list (min 1 item)", () => {
  const result = postBody.safeParse([{ type: "list", ordered: true, items: [] }]);
  assert.equal(result.success, false);
});

// ── Listing: client-side category filter + "Load more" visibility rules ─────────
test("filter: 'All' pages by index; a category shows all its cards and hides the rest", () => {
  const hidden = (active: string, category: string, index: number, limit?: number) =>
    isFilterItemHidden({ active, category, index, limit });
  assert.equal(hidden(ALL_CATEGORIES, "owner-guides", 0, 9), false);
  assert.equal(hidden(ALL_CATEGORIES, "owner-guides", 8, 9), false);
  assert.equal(hidden(ALL_CATEGORIES, "owner-guides", 9, 9), true);
  assert.equal(hidden(ALL_CATEGORIES, "owner-guides", 50), false); // no paging
  assert.equal(hidden("owner-guides", "owner-guides", 12, 9), false); // filtered view is complete
  assert.equal(hidden("str-tips", "owner-guides", 0, 9), true);
});

test("load more: only on 'All' while cards are paged out", () => {
  assert.equal(hasMoreItems({ active: ALL_CATEGORIES, total: 8, limit: 9 }), false);
  assert.equal(hasMoreItems({ active: ALL_CATEGORIES, total: 9, limit: 9 }), false);
  assert.equal(hasMoreItems({ active: ALL_CATEGORIES, total: 10, limit: 9 }), true);
  assert.equal(hasMoreItems({ active: ALL_CATEGORIES, total: 10, limit: 18 }), false);
  assert.equal(hasMoreItems({ active: "owner-guides", total: 30, limit: 9 }), false);
  assert.equal(hasMoreItems({ active: ALL_CATEGORIES, total: 30 }), false);
});
