import assert from "node:assert/strict";
import { test } from "node:test";
import { Schema } from "@tiptap/pm/model";
import { DecorationSet } from "@tiptap/pm/view";
import { EditorState } from "@tiptap/pm/state";
import { richTextFeedbackKey, richTextFeedbackPlugin, type RichTextFeedbackSnapshot } from "../admin/ui/post-rich-text-feedback";
const schema = new Schema({ nodes: {
  doc: { content: "block+" },
  heading: { group: "block", content: "text*", attrs: { level: { default: 2 }, original: { default: null } } },
  paragraph: { group: "block", content: "text*", attrs: { original: { default: null } } },
  bulletList: { group: "block", content: "listItem+" },
  listItem: { content: "paragraph" },
  text: { group: "inline" },
} });
function fixture() {
  let snapshot: RichTextFeedbackSnapshot = { enabled: true, errors: {}, errorId: "body-errors" };
  const plugin = richTextFeedbackPlugin(() => snapshot);
  let state = EditorState.create({ schema, plugins: [plugin], doc: schema.nodeFromJSON({ type: "doc", content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Heading" }] },
    { type: "paragraph", content: [{ type: "text", text: "Paragraph" }] },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "List item" }] }] }] },
  ] }) });
  const decorated = () => (plugin.props.decorations!.call(plugin, state) as DecorationSet).find().map(decoration => (decoration as unknown as { type: { attrs: Record<string, string> } }).type.attrs);
  return {
    get state() { return state; }, decorated,
    typeHeading() { state = state.apply(state.tr.insertText(" ", 1, 8)); },
    updateFeedback(errors: Record<string, string>, enabled = true) { snapshot = { ...snapshot, errors, enabled }; state = state.apply(state.tr.setMeta(richTextFeedbackKey, "feedback changed")); },
    redrawTransaction() { state = state.apply(state.tr.setMeta("editable", false)); },
  };
}
test("native heading, paragraph and list receive persistent exact field destinations", () => {
  const f = fixture();
  assert.deepEqual(f.decorated().map(item => item["data-post-body-path"]), ["body.0.text", "body.1.text", "body.2.items"]);
  f.typeHeading();
  f.redrawTransaction();
  assert.deepEqual(f.decorated().map(item => item["data-feedback-path"]), ["body.0.text", "body.1.text", "body.2.items"]);
  assert.equal(f.state.doc.firstChild?.textContent, " ");
});
test("known block errors stay red and associated after typing and editor-state redraws", () => {
  const f = fixture();
  f.typeHeading();
  f.updateFeedback({ "body.0.text": "Text is required." });
  f.redrawTransaction();
  const heading = f.decorated()[0]!;
  assert.equal(heading["data-field-invalid"], "true");
  assert.equal(heading["aria-describedby"], "body-errors");
  assert.equal(heading["aria-invalid"], undefined, "native block keeps its heading/paragraph/list semantics");
  assert.match(heading.class ?? "", /outline-red-600/);
  assert.equal(f.decorated()[1]!["data-field-invalid"], "false");
  f.updateFeedback({ "body.1.text": "Another error." });
  assert.equal(f.decorated()[0]!["data-field-invalid"], "false");
  assert.equal(f.decorated()[1]!["data-field-invalid"], "true");
});
test("decorations never change portable document attrs or opt in legacy editors", () => {
  const f = fixture();
  const before = JSON.stringify(f.state.doc.toJSON());
  f.updateFeedback({ "body.2.items.0": "List text is required." });
  assert.equal(f.decorated()[2]!["data-field-invalid"], "true");
  assert.equal(JSON.stringify(f.state.doc.toJSON()), before);
  assert.doesNotMatch(before, /data-feedback|aria-invalid|outline-red/);
  f.updateFeedback({}, false);
  assert.deepEqual(f.decorated(), []);
});
