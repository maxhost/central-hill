import assert from "node:assert/strict";
import { test } from "node:test";
import type { PostBody } from "../body";
import { headingIds, slugifyHeading, tocItems } from "../ui/components/headings";

/**
 * Heading anchors shared by the post TOC and the body renderer. Pure, no DB.
 * Run: `npx tsx --test src/slices/blog/tests/headings.test.ts`.
 */
test("slugifyHeading lowercases, drops diacritics and punctuation", () => {
  assert.equal(slugifyHeading("Príncipe Real and Estrela"), "principe-real-and-estrela");
  assert.equal(slugifyHeading("Historic centre: Baixa, Chiado and Alfama"), "historic-centre-baixa-chiado-and-alfama");
  assert.equal(slugifyHeading("  Ça va? Ñandú!  "), "ca-va-nandu");
  assert.equal(slugifyHeading("🏖️"), "");
});

test("headingIds is index-aligned and deduplicates with -2, -3", () => {
  const body: PostBody = [
    { type: "paragraph", text: "Lead." },
    { type: "heading", level: 2, text: "Costs" },
    { type: "heading", level: 3, text: "Costs" },
    { type: "heading", level: 2, text: "Costs-2" },
    { type: "heading", level: 2, text: "Costs" },
    { type: "heading", level: 4, text: "🏖️" },
  ];
  assert.deepEqual(headingIds(body), [undefined, "costs", "costs-2", "costs-2-2", "costs-3", "section"]);
});

test("tocItems keeps h2 + h3 (as sub), carries numbers, skips h4", () => {
  const body: PostBody = [
    { type: "heading", level: 2, number: "01", text: "Historic centre" },
    { type: "paragraph", text: "Text." },
    { type: "heading", level: 3, text: "A quick checklist" },
    { type: "heading", level: 4, text: "Fine print" },
  ];
  const ids = headingIds(body);
  assert.deepEqual(tocItems(body, ids), [
    { id: "historic-centre", label: "Historic centre", number: "01" },
    { id: "a-quick-checklist", label: "A quick checklist", sub: true },
  ]);
});

test("a body without headings has an empty TOC", () => {
  const body: PostBody = [{ type: "paragraph", text: "Only prose." }];
  assert.deepEqual(tocItems(body, headingIds(body)), []);
});
