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

test("selection focus is optional, boolean and retains the existing message guards", () => {
  for (const focus of [true, false]) {
    const data = { ...select, focus };
    assert.deepEqual(readPageEditorMessage({ ...event, data }, expected), data);
    assert.equal(readPageEditorMessage({ ...event, origin: "https://other.test", data }, expected), null);
  }
  for (const focus of [null, "false", 0, {}])
    assert.equal(readPageEditorMessage({ ...event, data: { ...select, focus } }, expected), null);
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

test("dialog visibility commands require a boolean and a current allowlisted binding", () => {
  const data = { channel: PAGE_EDITOR_CHANNEL, instance: expected.instance, type: "dialog", bindingId: "hero.title", open: true };
  assert.deepEqual(readPageEditorMessage({ ...event, data }, expected), data);
  assert.equal(readPageEditorMessage({ ...event, data: { ...data, open: false } }, expected)?.type, "dialog");
  for (const open of [undefined, null, "true", 1, {}])
    assert.equal(readPageEditorMessage({ ...event, data: { ...data, open } }, expected), null);
  for (const patch of [{ bindingId: "unknown" }, { instance: "old-locale" }, { channel: "other" }])
    assert.equal(readPageEditorMessage({ ...event, data: { ...data, ...patch } }, expected), null);
  assert.equal(readPageEditorMessage({ ...event, origin: "https://other.test", data }, expected), null);
  assert.equal(readPageEditorMessage({ ...event, source: {} as MessageEventSource, data }, expected), null);
});


test("accepts bounded snapshot data only from the current preview instance", () => {
  const data = { channel: PAGE_EDITOR_CHANNEL, instance: expected.instance, type: "preview", revision: 12, payload: { envelope: { title: "Local text", figures: [1, null, true] } } };
  assert.deepEqual(readPageEditorMessage({ ...event, data }, expected), data);
  for (const patch of [{ origin: "https://evil.test" }, { source: {} as MessageEventSource }]) {
    assert.equal(readPageEditorMessage({ ...event, ...patch, data }, expected), null);
  }
  assert.equal(readPageEditorMessage({ ...event, data: { ...data, instance: "older-locale" } }, expected), null);
});

test("rejects invalid revisions, missing or non-JSON and oversized snapshot payloads", () => {
  const data = { channel: PAGE_EDITOR_CHANNEL, instance: expected.instance, type: "preview", revision: 0, payload: null };
  for (const revision of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1", undefined]) {
    assert.equal(readPageEditorMessage({ ...event, data: { ...data, revision } }, expected), null);
  }
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  const deep = Array.from({ length: 34 }).reduce<object>(node => ({ child: node }), {});
  for (const payload of [undefined, () => 1, { n: NaN }, new Date(), cyclic, deep, "x".repeat(256 * 1024), { text: "é".repeat(140000) }]) {
    assert.equal(readPageEditorMessage({ ...event, data: { ...data, payload } }, expected), null);
  }
  const missing = { channel: PAGE_EDITOR_CHANNEL, instance: expected.instance, type: "preview", revision: 0 };
  assert.equal(readPageEditorMessage({ ...event, data: missing }, expected), null);
  assert.equal(readPageEditorMessage({ ...event, data: Object.assign(Object.create({ payload: {} }), missing) }, expected), null);
});
