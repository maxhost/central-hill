import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { describe, withFeedbackRules, type FieldNode } from "../admin/form-model";
import { knownPageFieldResolved } from "../admin/page-feedback";
import { homeNode } from "../admin/home-contextual";
import { homeSchema } from "../schemas/home";
const tree = withFeedbackRules(describe(homeSchema), homeSchema);
test("schema-owned required indicators do not infer truthiness or nonoptional strings", () => {
  const schema = z.object({ text: z.string(), count: z.string().regex(/^\d+$/), optionalChoice: z.enum(["one", "two"]).optional(), checkbox: z.boolean(), url: z.url({ protocol: /^https?$/ }) });
  const nodes = withFeedbackRules(describe(schema), schema);
  assert.equal(homeNode(nodes, "text")?.publishRequired, false);
  assert.equal(homeNode(nodes, "count")?.publishRequired, true);
  assert.equal(homeNode(nodes, "optionalChoice")?.publishRequired, false);
  assert.equal(homeNode(nodes, "checkbox")?.publishRequired, undefined);
  assert.equal(homeNode(nodes, "url")?.publishRequired, true);
  assert.equal("publishRequired" in describe(z.string()), false, "legacy metadata contract stays unchanged");
});
test("correcting one URL validates its real protocol and preserves incomplete requirements", () => {
  const url = homeNode(tree, "hero.cta_primary.url");
  assert.equal(knownPageFieldResolved(url, "", "hero.cta_primary.url"), false);
  assert.equal(knownPageFieldResolved(url, "javascript:alert(1)", "hero.cta_primary.url"), false);
  assert.equal(knownPageFieldResolved(url, "ftp://example.com", "hero.cta_primary.url"), false);
  assert.equal(knownPageFieldResolved(url, "https://example.com", "hero.cta_primary.url"), true);
});
test("server-only media and reference errors cannot disappear from a superficial schema check", () => {
  const node: FieldNode = { kind: "string", multiline: false, optional: true };
  assert.equal(knownPageFieldResolved(node, "some-ref", "faq_group_key", false, "Choose a published FAQ group."), false);
  assert.equal(knownPageFieldResolved({ kind: "media", accept: "image" }, "bad-id", "hero.image_media_id", false, "Invalid media reference."), false);
});
test("a legal body correction checks nested blocks individually and retains other invalid fields", () => {
  const body = [{ type: "heading", level: 2, text: "Valid heading" }, { type: "paragraph", text: "" }];
  assert.equal(knownPageFieldResolved(undefined, body, "body", true), false);
  assert.equal(knownPageFieldResolved(undefined, body, "body.0.text", true), true);
  assert.equal(knownPageFieldResolved(undefined, body, "body.1.text", true), false);
  assert.equal(knownPageFieldResolved(undefined, [{ type: "paragraph", text: "Complete" }], "body", true), true);
  assert.equal(knownPageFieldResolved(undefined, [{ type: "image", media_id: "d3a17a28-93fb-4ce6-8ee0-91ce6cce251b" }], "body", true), false);
});
