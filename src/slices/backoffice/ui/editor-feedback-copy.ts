import type { EditorLocale } from "../page-editor-types";
export type FeedbackAction = "save" | "publish";
export interface FeedbackIssue { path: string; label: string; message: string; section?: string; required?: boolean; sourceLocale?: EditorLocale }
export interface FeedbackGroup { locale: EditorLocale; issues: FeedbackIssue[]; notice?: string; uncertain?: boolean }
export type FeedbackOutcome = "success" | "validation" | "conflict" | "server" | "uncertain" | "no_draft";
export interface FeedbackMessageInput { action: FeedbackAction; locale: EditorLocale; outcome: FeedbackOutcome; groups?: FeedbackGroup[]; refreshWarning?: boolean; sharedChanged?: boolean }
/** Editorial UI copy, independent of the content language and safe in client bundles. */
export function feedbackMessage({ action, locale, outcome, groups = [], refreshWarning, sharedChanged }: FeedbackMessageInput): string {
  const language = locale.toUpperCase();
  if (outcome === "success") {
    if (refreshWarning) return `${action === "publish" ? "Published" : "Draft saved"} (${language}), but the public view could not be refreshed. Please check the page.`;
    return action === "publish" ? `Changes published (${language} only).` : `Draft saved (${language}).${sharedChanged ? " Shared fields were also updated for all languages." : ""}`;
  }
  if (outcome === "uncertain") return `We could not confirm whether your ${language} ${action === "publish" ? "changes were published" : "draft was saved"}. Your edits are still here. Reload to check before trying again.`;
  if (outcome === "conflict") return `Cannot continue in ${language}: this draft or its shared source changed. Reload the latest version.`;
  if (outcome === "no_draft") return `Cannot publish ${language}: save your changes before publishing.`;
  if (outcome === "server") return `Cannot ${action} ${language}: the server rejected the action. Your edits are still here.`;
  const own = groups.find(group => group.locale === locale)?.issues ?? [];
  const others = groups.filter(group => group.locale !== locale && group.issues.length).map(group => `${group.locale.toUpperCase()} (${group.issues.length})`);
  const first = own[0];
  const count = own.length;
  return `Cannot ${action} ${language}: fix ${count || "the"} ${count === 1 ? "error" : "errors"} in ${language}.${first ? ` First: ${language} → ${first.section ? `${first.section} → ` : ""}${first.label}.` : ""}${others.length ? ` Other known errors: ${others.join(", ")}.` : ""}`;
}
export function uploadFeedback(locale: EditorLocale, names: readonly string[]): string {
  return `Could not upload ${names.map(name => `“${name}”`).join(", ")} for ${locale.toUpperCase()}. Your ${locale.toUpperCase()} draft has not been saved. Retry the upload.`;
}
/** Avoid exposing storage responses (signed URLs, headers, stacks) in the editor. */
export function uploadFailureCause(stage: "presign" | "put" | "finalize"): string {
  return stage === "presign" ? "Could not start the upload. Try again." : stage === "finalize" ? "The file was transferred, but could not be finalized. Try again." : "The file could not be transferred. Check your connection and try again.";
}
