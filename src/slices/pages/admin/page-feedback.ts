import { postBody } from "@slices/blog/rich-text-contract";
import type { FieldNode } from "./form-model";
/** Serialized constraints mirror the schema only for resolving already-known errors. */
export function knownPageFieldResolved(node: FieldNode | undefined, value: unknown, path: string, legal = false, message?: string): boolean {
  if (legal && (path === "body" || path.startsWith("body."))) {
    const parsed = postBody.max(200).safeParse(value);
    if (!parsed.success) {
      if (path === "body") return false;
      const ownPath = path.slice("body.".length);
      return !parsed.error.issues.some(issue => { const issuePath = issue.path.join("."); return issuePath === ownPath || issuePath.startsWith(`${ownPath}.`) || ownPath.startsWith(`${issuePath}.`); });
    }
    if (parsed.data.some(block => !["heading", "paragraph", "list", "divider"].includes(block.type))) return false;
    return parsed.data.some(block => ("text" in block && Boolean(block.text.trim())) || (block.type === "list" && block.items.some(item => item.trim())));
  }
  if (legal && path === "title") return typeof value === "string" && value.trim().length > 0;
  if (message && !/too small|too big|invalid|digits only|enter a page title|enter page content|expected string|required/i.test(message)) return false;
  if (node?.kind === "media" || node?.kind === "select") return false;
  if (!node || node.kind === "object" || node.kind === "array" || node.kind === "hidden") return false;
  if (value == null) return !node.publishRequired;
  if (typeof value !== "string") return node.kind === "boolean";
  if (!value) return !node.publishRequired;
  const rules = node.feedbackRules;
  if (rules?.min != null && value.length < rules.min) return false;
  if (rules?.max != null && value.length > rules.max) return false;
  if (rules?.pattern && !new RegExp(rules.pattern).test(value)) return false;
  if (rules?.format === "url") { try { const url = new URL(value); if (rules.protocolPattern && !new RegExp(rules.protocolPattern).test(url.protocol.slice(0, -1))) return false; } catch { return false; } }
  return true;
}
export function pageFeedbackPath(raw: string): string { return raw.replace(/^content\./, ""); }
