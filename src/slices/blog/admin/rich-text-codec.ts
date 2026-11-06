import { isSafeInlineHref, type BodyBlock, type InlineTextRun, type PostBody } from "../body";

export type EditorNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};
export type EditorDocument = EditorNode & { type: "doc"; content: EditorNode[] };
export class RichTextConversionError extends Error {
  constructor() { super("Unsupported article content; original content is retained."); }
}
const fail = (): never => { throw new RichTextConversionError(); };
function textNodes(text: string, runs?: InlineTextRun[]): EditorNode[] {
  if (runs && runs.map(run => run.text).join("") !== text) fail();
  return (runs ?? [{ text }]).filter(run => run.text).map(run => ({
    type: "text", text: run.text,
    ...(run.bold || run.italic || run.href ? { marks: [
      ...(run.bold ? [{ type: "bold" }] : []), ...(run.italic ? [{ type: "italic" }] : []),
      ...(run.href ? [{ type: "link", attrs: { href: isSafeInlineHref(run.href) ? run.href : fail() } }] : []),
    ] } : {}),
  }));
}
export function postBodyToEditorDocument(body: PostBody): EditorDocument {
  return { type: "doc", content: body.length ? body.map(block => {
    const attrs: Record<string, unknown> = { original: block };
    switch (block.type) {
      case "paragraph": return { type: "paragraph", attrs, content: textNodes(block.text, block.inline) };
      case "heading": return { type: "heading", attrs: { ...attrs, level: block.level, number: block.number ?? null }, content: textNodes(block.text, block.inline) };
      case "quote": return { type: "articleQuote", attrs: { ...attrs, attribution: block.attribution ?? null }, content: textNodes(block.text, block.inline) };
      case "callout": return { type: "articleCallout", attrs: { ...attrs, variant: block.variant }, content: textNodes(block.body, block.inline) };
      case "list":
        if (block.inline_items && block.inline_items.length !== block.items.length) fail();
        return { type: block.ordered ? "orderedList" : "bulletList", attrs,
          content: block.items.map((item, index) => ({ type: "listItem", content: [{ type: "paragraph", content: textNodes(item, block.inline_items?.[index]) }] })) };
      case "image": return { type: "articleImage", attrs: { ...attrs, media_id: block.media_id, caption: block.caption ?? null, alt: block.alt ?? null } };
      case "cta": return { type: "articleCta", attrs: { ...attrs, label: block.label, url: block.url } };
      case "divider": return { type: "horizontalRule", attrs };
      default: return fail();
    }
  }) : [{ type: "paragraph" }] };
}
function inline(content: EditorNode[] = []): { text: string; inline?: InlineTextRun[] } {
  const runs = content.map(node => {
    if (node.type !== "text" || typeof node.text !== "string" || node.content) return fail();
    const run: InlineTextRun = { text: node.text };
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") run.bold = true;
      else if (mark.type === "italic") run.italic = true;
      else if (mark.type === "link" && typeof mark.attrs?.href === "string" && isSafeInlineHref(mark.attrs.href)) run.href = mark.attrs.href;
      else fail();
    }
    return run;
  }).filter(run => run.text);
  return { text: runs.map(run => run.text).join(""), ...(runs.some(run => run.bold || run.italic || run.href) ? { inline: runs } : {}) };
}
function sameRuns(a: InlineTextRun[] | undefined, b: InlineTextRun[] | undefined, text: string): boolean {
  const normalize = (runs: InlineTextRun[] | undefined) => {
    const result: InlineTextRun[] = [];
    for (const run of runs ?? [{ text }]) {
      if (!run.text) continue;
      const next = { text: run.text, ...(run.bold ? { bold: true } : {}), ...(run.italic ? { italic: true } : {}), ...(run.href ? { href: run.href } : {}) };
      const last = result.at(-1);
      if (last && last.bold === next.bold && last.italic === next.italic && last.href === next.href) last.text += next.text;
      else result.push(next);
    }
    return result;
  };
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}
function preserveInline(next: BodyBlock, original: BodyBlock | undefined): BodyBlock {
  if (!original || original.type !== next.type) return next;
  if (next.type === "list" && original.type === "list") {
    if (next.items.length === original.items.length && next.items.every((text, i) => text === original.items[i] && sameRuns(next.inline_items?.[i], original.inline_items?.[i], text))) {
      if (original.inline_items) next.inline_items = original.inline_items;
      else delete next.inline_items;
    }
  } else if ("text" in next && "text" in original || next.type === "callout" && original.type === "callout") {
    const nextText = "text" in next ? next.text : next.type === "callout" ? next.body : "";
    const oldText = "text" in original ? original.text : original.type === "callout" ? original.body : "";
    const nextRich = next as BodyBlock & { inline?: InlineTextRun[] };
    const oldRich = original as BodyBlock & { inline?: InlineTextRun[] };
    if (nextText === oldText && sameRuns(nextRich.inline, oldRich.inline, nextText)) {
      if (oldRich.inline) nextRich.inline = oldRich.inline;
      else delete nextRich.inline;
    }
  }
  return next;
}
/** Reject unsupported nodes/marks/nesting atomically instead of silently dropping them. */
export function editorDocumentToPostBody(document: EditorDocument): PostBody {
  if (document.type !== "doc" || !Array.isArray(document.content)) return fail();
  return document.content.flatMap(node => {
    if (node.marks?.length) return fail();
    const attrs = node.attrs ?? {};
    const optional = (key: string) => attrs[key] == null ? {} : typeof attrs[key] === "string" ? { [key]: attrs[key] } : fail();
    let block: BodyBlock;
    switch (node.type) {
      case "paragraph": {
        const value = inline(node.content);
        if (!value.text && !(attrs.original && (attrs.original as BodyBlock).type === "paragraph")) return [];
        block = { type: "paragraph", ...value }; break;
      }
      case "heading":
        if (![2, 3, 4].includes(Number(attrs.level))) return fail();
        block = { type: "heading", level: attrs.level as 2 | 3 | 4, ...optional("number"), ...inline(node.content) }; break;
      case "articleQuote": block = { type: "quote", ...optional("attribution"), ...inline(node.content) }; break;
      case "articleCallout": {
        if (!["info", "tip", "warning", "note"].includes(String(attrs.variant))) return fail();
        const { text, ...rich } = inline(node.content);
        block = { type: "callout", variant: attrs.variant as "info" | "tip" | "warning" | "note", body: text, ...rich }; break;
      }
      case "bulletList": case "orderedList": {
        if (node.type === "orderedList" && attrs.start != null && attrs.start !== 1) return fail();
        const items = (node.content ?? []).map(item => {
          if (item.marks?.length || item.type !== "listItem" || item.content?.length !== 1 || item.content[0]?.type !== "paragraph") return fail();
          return inline(item.content[0].content);
        });
        block = { type: "list", ordered: node.type === "orderedList", items: items.map(item => item.text),
          ...(items.some(item => item.inline) ? { inline_items: items.map(item => item.inline ?? (item.text ? [{ text: item.text }] : [])) } : {}) }; break;
      }
      case "articleImage":
        if (typeof attrs.media_id !== "string" || node.content?.length) return fail();
        block = { type: "image", media_id: attrs.media_id, ...optional("caption"), ...optional("alt") }; break;
      case "articleCta":
        if (typeof attrs.label !== "string" || typeof attrs.url !== "string" || node.content?.length) return fail();
        block = { type: "cta", label: attrs.label, url: attrs.url }; break;
      case "horizontalRule": if (node.content?.length) return fail(); block = { type: "divider" }; break;
      default: return fail();
    }
    return [preserveInline(block, attrs.original as BodyBlock | undefined)];
  });
}
