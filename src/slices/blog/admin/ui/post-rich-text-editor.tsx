"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Extension, type JSONContent } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";
import { AdminButton, Field, TextInput, type AdminMediaPreview } from "@slices/backoffice/contract";
import { isSafeInlineHref, type PostBody } from "../../body";
import { editorDocumentToPostBody, postBodyToEditorDocument, type EditorDocument } from "../rich-text-codec";
import { ArticleCallout, ArticleCta, ArticleImage, ArticleMetadata, ArticleQuote, FlatListItem, RichTextMediaContext } from "./post-rich-text-nodes";

type Props = {
  value: PostBody; onChange: (next: PostBody) => void;
  previews: Record<string, AdminMediaPreview>; onPreview: (preview: AdminMediaPreview | null) => void;
  errors?: Record<string, string>; disabled?: boolean; localeKey: string;
};
/** Locale remounts reset undo history; controlled typing echoes never replace the document. */
export function PostRichTextEditor(props: Props) {
  return <LocaleRichTextEditor key={props.localeKey} {...props} />;
}
function LocaleRichTextEditor({ value, onChange, previews, onPreview, errors = {}, disabled = false }: Props) {
  const fieldPrefix = useId();
  const t = useTranslations("blog.richText");
  const tb = useTranslations("blog.admin.post.body.fields");
  const latest = useRef({ onChange });
  latest.current = { onChange };
  const emitted = useRef(JSON.stringify(value));
  const [unsupported, setUnsupported] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkInvalid, setLinkInvalid] = useState(false);
  const initial = useRef<EditorDocument | null>(null);
  const initialInvalid = useRef(false);
  if (!initial.current) {
    try { initial.current = postBodyToEditorDocument(value); }
    catch { initial.current = { type: "doc", content: [{ type: "paragraph" }] }; initialInvalid.current = true; }
  }
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, blockquote: false, listItem: false, code: false, codeBlock: false, strike: false, underline: false, hardBreak: false,
        link: { openOnClick: false, autolink: false, linkOnPaste: false, isAllowedUri: href => isSafeInlineHref(href), HTMLAttributes: { class: "underline underline-offset-2" } } }),
      ArticleMetadata, FlatListItem, ArticleImage, ArticleQuote, ArticleCallout, ArticleCta,
      Extension.create({ name: "articleSafety", addProseMirrorPlugins() { return [new Plugin({
        filterTransaction(transaction) {
          if (!transaction.docChanged) return true;
          try { editorDocumentToPostBody(transaction.doc.toJSON() as EditorDocument); return true; }
          catch { queueMicrotask(() => setUnsupported(true)); return false; }
        },
      })]; } }),
    ],
    content: initial.current as JSONContent,
    editable: !disabled && !initialInvalid.current,
    editorProps: {
      attributes: { role: "textbox", "aria-multiline": "true", "aria-label": t("bodyLabel"), "data-post-rich-text": "",
        class: "min-h-[420px] px-5 py-6 text-[17px] leading-relaxed text-ink outline-none sm:px-8 [&_p]:my-4 [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-3xl [&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:font-serif [&_h3]:text-2xl [&_h4]:my-4 [&_h4]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-7 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-7 [&_li_p]:my-1 [&_hr]:my-8 [&_hr]:border-line [&_.is-editor-empty]:before:pointer-events-none" },
      // File images must use MediaField's scoped upload queue. HTML nesting/unsupported marks are explicitly refused.
      handlePaste(_view, event) {
        const html = event.clipboardData?.getData("text/html") ?? "";
        const pasted = html ? new DOMParser().parseFromString(html, "text/html") : null;
        if (event.clipboardData?.files.length || pasted?.querySelector("img,figure,aside,table,pre,code,s,strike,del,u,sub,sup,mark,h1,h5,h6,iframe,video,script,li ul,li ol,br") ||
          Array.from(pasted?.querySelectorAll("a[href]") ?? []).some(link => !isSafeInlineHref(link.getAttribute("href") ?? "")) || /text-decoration[^;"']*(?:underline|line-through)/i.test(html)) {
          setUnsupported(true); return true;
        }
        return false;
      },
      handleDrop(_view, event) { if (event.dataTransfer?.files.length) { setUnsupported(true); return true; } return false; },
    },
    onUpdate({ editor: current, transaction }) {
      if (!transaction.docChanged) return;
      try {
        const body = editorDocumentToPostBody(current.getJSON() as EditorDocument);
        emitted.current = JSON.stringify(body);
        latest.current.onChange(body);
        setUnsupported(false);
      } catch { setUnsupported(true); }
    },
  });
  useEditorState({ editor, selector: snapshot => snapshot.transactionNumber });
  useEffect(() => { editor?.setEditable(!disabled && !initialInvalid.current, false); }, [editor, disabled]);
  useEffect(() => {
    const external = JSON.stringify(value);
    if (!editor || external === emitted.current) return;
    try {
      editor.commands.setContent(postBodyToEditorDocument(value), { emitUpdate: false });
      emitted.current = external;
    } catch { setUnsupported(true); }
  }, [editor, value]);
  const locked = disabled || initialInvalid.current || !editor;
  const button = (key: Parameters<typeof t>[0], run: () => void, active = false, unavailable = false) => <button key={key} type="button" title={t(key)} aria-label={t(key)} aria-pressed={active}
    disabled={locked || unavailable} onMouseDown={event => event.preventDefault()} onClick={run}
    className={`rounded px-2.5 py-2 text-xs font-medium transition-colors hover:bg-bg disabled:opacity-35 ${active ? "bg-accent/15 text-accent-deep" : "text-ink-soft"}`}>{t(key)}</button>;
  const selectedHeading = editor?.isActive("heading");
  return <RichTextMediaContext.Provider value={{ previews, onPreview, disabled: locked }}>
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div role="toolbar" aria-label={t("bodyLabel")} className="sticky top-0 z-10 flex flex-wrap gap-0.5 border-b border-line bg-surface p-2">
        {button("paragraph", () => editor?.chain().focus().setParagraph().run(), editor?.isActive("paragraph"))}
        {([2, 3, 4] as const).map(level => button(`heading${level}`, () => editor?.chain().focus().toggleHeading({ level }).run(), editor?.isActive("heading", { level })))}
        {button("bold", () => editor?.chain().focus().toggleBold().run(), editor?.isActive("bold"))}
        {button("italic", () => editor?.chain().focus().toggleItalic().run(), editor?.isActive("italic"))}
        {button("link", () => { setLinkUrl(String(editor?.getAttributes("link").href ?? "")); setLinkOpen(true); setLinkInvalid(false); }, editor?.isActive("link"), editor?.state.selection.empty && !editor?.isActive("link"))}
        {button("unlink", () => editor?.chain().focus().extendMarkRange("link").unsetLink().run(), false, !editor?.isActive("link"))}
        {button("bulletList", () => editor?.chain().focus().toggleBulletList().run(), editor?.isActive("bulletList"))}
        {button("orderedList", () => editor?.chain().focus().toggleOrderedList().run(), editor?.isActive("orderedList"))}
        {button("quote", () => editor?.chain().focus().toggleNode("articleQuote", "paragraph").run(), editor?.isActive("articleQuote"))}
        {button("divider", () => editor?.chain().focus().setHorizontalRule().run())}
        {button("insertImage", () => editor?.chain().focus().insertContent({ type: "articleImage", attrs: { media_id: "" } }).run())}
        {button("callout", () => editor?.chain().focus().insertContent({ type: "articleCallout", attrs: { variant: "info" } }).run())}
        {button("button", () => editor?.chain().focus().insertContent({ type: "articleCta", attrs: { label: "", url: "" } }).run())}
        {button("undo", () => editor?.chain().focus().undo().run(), false, !editor?.can().undo())}
        {button("redo", () => editor?.chain().focus().redo().run(), false, !editor?.can().redo())}
      </div>
      {linkOpen ? <fieldset disabled={locked} className="flex flex-wrap items-end gap-3 border-b border-line bg-bg p-4">
        <div className="min-w-48 flex-1"><Field label={t("linkUrl")} htmlFor={`${fieldPrefix}-link-url`} error={linkInvalid ? t("unsupported") : undefined}>
          <TextInput id={`${fieldPrefix}-link-url`} autoFocus type="url" value={linkUrl} onChange={event => { setLinkUrl(event.target.value); setLinkInvalid(false); }} />
        </Field></div>
        <AdminButton onClick={() => {
          if (!isSafeInlineHref(linkUrl)) { setLinkInvalid(true); return; }
          editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run(); setLinkOpen(false);
        }}>{t("applyLink")}</AdminButton>
        <AdminButton onClick={() => { setLinkOpen(false); editor?.commands.focus(); }}>{t("cancel")}</AdminButton>
      </fieldset> : null}
      {selectedHeading ? <fieldset disabled={locked} className="border-b border-line px-5 py-3"><Field label={tb("number")} htmlFor={`${fieldPrefix}-heading-number`}><TextInput id={`${fieldPrefix}-heading-number`} value={editor?.getAttributes("heading").number ?? ""} maxLength={12}
        onChange={event => editor?.commands.updateAttributes("heading", { number: event.target.value })} /></Field></fieldset> : null}
      {unsupported || initialInvalid.current ? <p role="alert" className="m-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{t("unsupported")}</p> : null}
      {Object.entries(errors).filter(([key]) => key.includes("body")).map(([key, error]) => <p key={key} role="alert" className="px-5 pt-3 text-sm text-red-700">{error}</p>)}
      <EditorContent editor={editor} />
      {!value.length ? <p className="pointer-events-none px-5 pb-4 text-sm text-ink-soft">{t("placeholder")}</p> : null}
    </div>
  </RichTextMediaContext.Provider>;
}
