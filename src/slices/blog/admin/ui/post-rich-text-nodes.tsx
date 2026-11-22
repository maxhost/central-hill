"use client";

import { createContext, useContext, useId } from "react";
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, useEditorState, type NodeViewProps } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { AdminButton, Field, MediaField, Select, TextInput, type AdminMediaPreview } from "@slices/backoffice/contract";

import { editorDocumentToPostBody } from "../rich-text-codec";

type MediaContext = { errors?: Record<string, string>; feedback?: boolean; previews: Record<string, AdminMediaPreview>; onPreview: (preview: AdminMediaPreview | null) => void; disabled: boolean };
export const RichTextMediaContext = createContext<MediaContext>({ previews: {}, onPreview: () => {}, disabled: false });

function ArticleNodeView({ node, updateAttributes, deleteNode, getPos, editor }: NodeViewProps) {
  const fieldPrefix = useId();
  const t = useTranslations("blog.richText");
  useEditorState({ editor, selector: snapshot => snapshot.transactionNumber });
  const { previews, onPreview, disabled, errors = {}, feedback } = useContext(RichTextMediaContext);
  const position = getPos();
  const topIndex = typeof position === "number" ? editor.state.doc.resolve(position).index(0) : 0;
  const preceding = editor.getJSON().content?.slice(0, topIndex) ?? [];
  let blockIndex = topIndex;
  try { blockIndex = editorDocumentToPostBody({ type: "doc", content: preceding }).length; } catch { /* original document errors remain visible */ }
  const bodyPath = `body.${blockIndex}`;
  const attrs = node.attrs;
  const image = node.type.name === "articleImage";
  const callout = node.type.name === "articleCallout";
  const quote = node.type.name === "articleQuote";
  const preview = image ? previews[String(attrs.media_id)] : undefined;
  return <NodeViewWrapper className={image || !quote ? "my-6 rounded-md border border-line bg-bg/50 p-4" : "my-6 border-l-2 border-accent pl-5"}>
    <div contentEditable={false} className="mb-3 flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t(image ? "image" : callout ? "callout" : quote ? "quote" : "button")}</span>
      <AdminButton variant="ghost" disabled={disabled} onClick={deleteNode}>{t("removeBlock")}</AdminButton>
    </div>
    <fieldset disabled={disabled} contentEditable={false} className="space-y-3">
      {image ? <>
        <Field errorPath={`${bodyPath}.media_id`} error={errors[`${bodyPath}.media_id`]} required={Boolean(feedback)} label={t("image")}><MediaField editAlt={false} key={`${attrs.media_id}:${preview?.url ?? ""}`} value={attrs.media_id || null} preview={preview ?? null}
          onChange={(id, media) => { if (disabled) return; updateAttributes({ media_id: id ?? "" }); onPreview(media); }} /></Field>
        <Field errorPath={`${bodyPath}.caption`} error={errors[`${bodyPath}.caption`]} required={Boolean(feedback && false)} label={t("caption")} htmlFor={`${fieldPrefix}-caption`}><TextInput id={`${fieldPrefix}-caption`} value={attrs.caption ?? ""} onChange={event => updateAttributes({ caption: event.target.value })} /></Field>
        <Field errorPath={`${bodyPath}.alt`} error={errors[`${bodyPath}.alt`]} required={Boolean(feedback && false)} label={t("alt")} htmlFor={`${fieldPrefix}-alt`}><TextInput id={`${fieldPrefix}-alt`} value={attrs.alt ?? ""} onChange={event => updateAttributes({ alt: event.target.value })} /></Field>
      </> : callout ? <Field errorPath={`${bodyPath}.variant`} error={errors[`${bodyPath}.variant`]} required={Boolean(feedback && false)} label={t("callout")} htmlFor={`${fieldPrefix}-variant`}><Select id={`${fieldPrefix}-variant`} value={attrs.variant} onChange={event => updateAttributes({ variant: event.target.value })}>
        {(["info", "tip", "warning", "note"] as const).map(variant => <option key={variant} value={variant}>{t(variant)}</option>)}
      </Select></Field> : quote ? null : <>
        <Field errorPath={`${bodyPath}.label`} error={errors[`${bodyPath}.label`]} required={Boolean(feedback && true)} label={t("label")} htmlFor={`${fieldPrefix}-label`}><TextInput id={`${fieldPrefix}-label`} value={attrs.label ?? ""} onChange={event => updateAttributes({ label: event.target.value })} /></Field>
        <Field errorPath={`${bodyPath}.url`} error={errors[`${bodyPath}.url`]} required={Boolean(feedback && true)} label={t("url")} htmlFor={`${fieldPrefix}-url`}><TextInput id={`${fieldPrefix}-url`} value={attrs.url ?? ""} onChange={event => updateAttributes({ url: event.target.value })} /></Field>
      </>}
    </fieldset>
    {callout || quote ? <NodeViewContent className={quote ? "min-h-8 font-serif text-xl" : "mt-3 min-h-8"} /> : null}
    {quote ? <fieldset disabled={disabled} contentEditable={false} className="mt-3"><Field errorPath={`${bodyPath}.attribution`} error={errors[`${bodyPath}.attribution`]} required={Boolean(feedback && false)} label={t("attribution")} htmlFor={`${fieldPrefix}-attribution`}><TextInput id={`${fieldPrefix}-attribution`} value={attrs.attribution ?? ""} onChange={event => updateAttributes({ attribution: event.target.value })} /></Field></fieldset> : null}
  </NodeViewWrapper>;
}

function articleNode(name: string, tag: string, fields: Record<string, unknown>, editable = false) {
  return Node.create({
    name, group: "block", ...(editable ? { content: "inline*" } : { atom: true }), defining: true,
    addAttributes() { return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { default: value, rendered: false }])); },
    // Only semantic quotes are accepted from pasted HTML; image/CTA/callout need explicit structured insertion.
    parseHTML() { return name === "articleQuote" ? [{ tag: "blockquote" }] : []; },
    renderHTML({ HTMLAttributes }) { return editable ? [tag, mergeAttributes(HTMLAttributes, { "data-article-node": name }), 0] : [tag, { "data-article-node": name }]; },
    addNodeView() { return ReactNodeViewRenderer(ArticleNodeView); },
  });
}
export const ArticleImage = articleNode("articleImage", "figure", { media_id: "", caption: null, alt: null });
export const ArticleCta = articleNode("articleCta", "div", { label: "", url: "" });
export const ArticleCallout = articleNode("articleCallout", "aside", { variant: "info" }, true);
export const ArticleQuote = articleNode("articleQuote", "blockquote", { attribution: null }, true);
export const FlatListItem = Node.create({
  name: "listItem", content: "paragraph", defining: true,
  parseHTML() { return [{ tag: "li" }]; },
  renderHTML({ HTMLAttributes }) { return ["li", HTMLAttributes, 0]; },
  addKeyboardShortcuts() { return {
    Enter: () => this.editor.commands.splitListItem(this.name),
    "Mod-Enter": () => this.editor.commands.liftListItem(this.name),
    Tab: () => true, "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
  }; },
});
/** Non-rendered source metadata keeps optional legacy fields and run segmentation intact. */
export const ArticleMetadata = Extension.create({
  name: "articleMetadata",
  addGlobalAttributes() { return [
    { types: ["paragraph", "heading", "bulletList", "orderedList", "horizontalRule", "articleImage", "articleQuote", "articleCallout", "articleCta"], attributes: { original: { default: null, rendered: false } } },
    { types: ["heading"], attributes: { number: { default: null, rendered: false } } },
  ]; },
});
