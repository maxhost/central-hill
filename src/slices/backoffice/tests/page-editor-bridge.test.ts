import assert from "node:assert/strict";
import test from "node:test";
import { PAGE_EDITOR_CHANNEL, pageEditorPreviewUrl, readPageEditorMessage } from "../ui/page-editor-bridge";

const source = {} as MessageEventSource;
const expected = { origin: "https://centralhill.test", source, instance: "editor-1", bindingIds: ["hero", "hero.title"] };
const select = { channel: PAGE_EDITOR_CHANNEL, instance: "editor-1", type: "select", bindingId: "hero.title" };
const event = { origin: expected.origin, source, data: select };

test("accepts allowlisted selection and preview ready", () => {
  assert.deepEqual(readPageEditorMessage(event, expected), select);
  assert.equal(readPageEditorMessage({ ...event, data: { ...select, type: "ready", bindingId: undefined } }, expected)?.type, "ready");
});

test("rejects other origins, windows, instances, channels and unknown bindings", () => {
  for (const patch of [{ origin: "https://evil.test" }, { source: {} as MessageEventSource }, { source: null }]) {
    assert.equal(readPageEditorMessage({ ...event, ...patch }, expected), null);
  }
  for (const data of [null, "select", {}, { ...select, instance: "old-frame" }, { ...select, channel: "other" }, { ...select, bindingId: "secret" }, { ...select, type: "save" }, { ...select, type: "ready" }]) {
    assert.equal(readPageEditorMessage({ ...event, data }, expected), null);
  }
  assert.equal(readPageEditorMessage(event, { ...expected, source: null }), null);
});

test("preview URL preserves existing query/hash and replaces bridge parameters", () => {
  assert.equal(pageEditorPreviewUrl("/admin/preview?locale=es&instance=old#hero", "new editor", 3), "/admin/preview?locale=es&instance=new+editor&editorVersion=3#hero");
  assert.equal(pageEditorPreviewUrl("/admin/preview", "one", 0), "/admin/preview?instance=one&editorVersion=0");
});
