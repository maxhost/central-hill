import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ButtonLink } from "../button";
import { TwoColumnShowcase } from "../two-column-showcase";
import { DualCtaPanels } from "../dual-cta-panels";

test("Private selection belongs to the complete anchor, including an unfinished empty label", () => {
  const html = renderToStaticMarkup(ButtonLink({
    href: "https://example.test/es/book", editorBinding: "hero.cta_primary.label", children: "",
  }));
  assert.match(html, /<a\b[^>]*data-editor-binding="hero\.cta_primary\.label"/);
  assert.match(html, /href="https:\/\/example.test\/es\/book"/);
  assert.match(html, /target="_blank"/);
  assert.doesNotMatch(renderToStaticMarkup(ButtonLink({ href: "/es/owners", children: "Owners" })), /data-editor-binding/);
});

test("Showcase and closing panels forward optional bindings without annotating public output", () => {
  const cta = { href: "https://example.test/fr/book", label: "Réserver" };
  const showcase = { headline: "Guests", image: null, cta };
  assert.doesNotMatch(renderToStaticMarkup(createElement(TwoColumnShowcase, showcase)), /data-editor-binding/);
  assert.match(renderToStaticMarkup(createElement(TwoColumnShowcase, {
    ...showcase, cta: { ...cta, editorBinding: "guests_pitch.cta.label" },
  })), /<a\b[^>]*data-editor-binding="guests_pitch\.cta\.label"/);
  const owner = { image: null, eyebrow: "", title: "Owners", body: "", cta: { href: "/fr/owners", label: "Owners" } };
  const guest = { image: null, eyebrow: "", title: "Guests", body: "", cta };
  assert.doesNotMatch(renderToStaticMarkup(createElement(DualCtaPanels, { panels: [owner, guest] })), /data-editor-binding/);
  const html = renderToStaticMarkup(createElement(DualCtaPanels, {
    panels: [owner, { ...guest, cta: { ...cta, editorBinding: "dual_cta.guest.cta_label" } }],
  }));
  assert.match(html, /<a\b[^>]*data-editor-binding="dual_cta\.guest\.cta_label"/);
  assert.match(html, /href="https:\/\/example.test\/fr\/book"/);
});
