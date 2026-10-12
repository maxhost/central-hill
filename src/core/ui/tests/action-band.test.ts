import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActionBand } from "../action-band";

/**
 * `core/ui` `ActionBand` — `cta` is optional (spec building-detail-admin-editor, D7). Pure, no DB. Run:
 *   npx tsx --tsconfig src/core/ui/tests/tsconfig.json --test src/core/ui/tests/action-band.test.ts
 */

test("without a cta: no link and no note (the action column is omitted)", () => {
  const html = renderToStaticMarkup(
    createElement(ActionBand, { eyebrow: "Book", title: "Book an apartment", body: "Intro", note: "Via Avantio" }),
  );
  assert.ok(html.includes("Book an apartment"));
  assert.ok(html.includes("Intro"));
  assert.ok(!html.includes("<a"), "no anchor without a cta");
  assert.ok(!html.includes("href="), "no orphan href");
  assert.ok(!html.includes("Via Avantio"), "the note lives in the action column");
});

test("with an external cta: renders the link, label arrow and note", () => {
  const html = renderToStaticMarkup(
    createElement(ActionBand, {
      title: "Book an apartment",
      cta: { href: "https://example.com/book", label: "Check availability", external: true },
      note: "Via Avantio",
    }),
  );
  assert.match(html, /<a href="https:\/\/example\.com\/book" target="_blank" rel="noopener noreferrer"/);
  assert.ok(html.includes("Check availability →"));
  assert.ok(html.includes("Via Avantio"));
});

test("with an internal cta: no target/rel", () => {
  const html = renderToStaticMarkup(
    createElement(ActionBand, { title: "T", cta: { href: "#book", label: "Book" } }),
  );
  assert.match(html, /<a href="#book"/);
  assert.ok(!html.includes("target="));
});
