import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { InlineRichText } from "../ui/components/inline-rich-text";

test("inline renderer uses escaped React text, semantic marks and safe anchors", () => {
  const html = renderToStaticMarkup(<InlineRichText text={'<script>alert(1)</script> link'} runs={[
    { text: "<script>alert(1)</script>", bold: true, italic: true }, { text: " link", href: "/en/blog" },
  ]} />);
  assert.ok(html.includes("<strong><em>&lt;script&gt;alert(1)&lt;/script&gt;</em></strong>"));
  assert.ok(html.includes('href="/en/blog"'));
  assert.ok(!html.includes("<script>"));
});
test("unsafe link is rendered as plain escaped text; mismatched rich text falls back to canonical text", () => {
  const unsafe = renderToStaticMarkup(<InlineRichText text="click" runs={[{ text: "click", href: "javascript:alert(1)" }]} />);
  assert.equal(unsafe, "click");
  const mismatch = renderToStaticMarkup(<InlineRichText text="Canonical" runs={[{ text: "Other", bold: true }]} />);
  assert.equal(mismatch, "Canonical");
  assert.equal(renderToStaticMarkup(<InlineRichText text="Legacy & text" />), "Legacy &amp; text");
});
