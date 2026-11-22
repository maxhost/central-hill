import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { editorDocumentToPostBody } from "../rich-text-codec";
export interface RichTextFeedbackSnapshot {
  enabled: boolean;
  errors: Record<string, string>;
  errorId: string;
}
export const richTextFeedbackKey = new PluginKey("articleEditorFeedback");
/** Editor-only decorations survive ProseMirror redraws; nothing enters the document. */
export function richTextFeedbackPlugin(read: () => RichTextFeedbackSnapshot): Plugin {
  return new Plugin({
    key: richTextFeedbackKey,
    props: {
      decorations(state) {
        const feedback = read();
        if (!feedback.enabled) return DecorationSet.empty;
        const decorations: Decoration[] = [];
        let index = 0;
        state.doc.forEach((node, position) => {
          let block;
          try { block = editorDocumentToPostBody({ type: "doc", content: [node.toJSON()] })[0]; }
          catch { return; }
          if (!block) return;
          const path = `body.${index++}`;
          // React NodeViews own media/CTA attribute controls; text destinations remain editor selections.
          const field = block.type === "callout" ? "body" : block.type === "list" ? "items" : "text" in block ? "text" : null;
          if (!field) return;
          const invalid = Object.keys(feedback.errors).some(key => key === path || key.startsWith(`${path}.`));
          const attrs: Record<string, string> = {
            "data-feedback-path": `${path}.${field}`,
            "data-post-body-path": `${path}.${field}`,
            "data-required-to-publish": "true",
            "data-field-invalid": String(invalid),
          };
          if (invalid) {
            attrs.class = "outline-2 outline-red-600";
            attrs["aria-describedby"] = feedback.errorId;
          }
          decorations.push(Decoration.node(position, position + node.nodeSize, attrs));
        });
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}
