import type { EditorLocale } from "../page-editor-types";
export type FeedbackAction = "save" | "publish";
export interface FeedbackIssue { path: string; label: string; message: string; section?: string; required?: boolean; sourceLocale?: EditorLocale }
export interface FeedbackGroup { locale: EditorLocale; issues: FeedbackIssue[]; notice?: string; uncertain?: boolean }
export type FeedbackOutcome = "success" | "validation" | "conflict" | "server" | "uncertain" | "no_draft";
export interface FeedbackMessageInput { action: FeedbackAction; locale: EditorLocale; outcome: FeedbackOutcome; groups?: FeedbackGroup[]; refreshWarning?: boolean; sharedChanged?: boolean; reloadRequired?: boolean }
/** Editorial UI copy, independent of the content language and safe in client bundles. */
export function feedbackMessage({ action, locale, outcome, groups = [], refreshWarning, sharedChanged, reloadRequired }: FeedbackMessageInput): string {
  const language = locale.toUpperCase();
  const otherErrors = groups.filter(group => group.locale !== locale && group.issues.length).map(group => `${group.locale.toUpperCase()} (${group.issues.length})`);
  const withKnown = (message: string) => `${message}${otherErrors.length ? ` Other known errors: ${otherErrors.join(", ")}.` : ""}`;
  if (outcome === "success") {
    if (reloadRequired) return `${action === "publish" ? "Changes published" : "Draft saved"} (${language}), but the latest editor state could not be loaded. Reload before continuing.`;
    if (refreshWarning) return `${action === "publish" ? "Published" : "Draft saved"} (${language}), but the public view could not be refreshed. Please check the page.`;
    return action === "publish" ? `Changes published (${language} only).` : `Draft saved (${language}).${sharedChanged ? " Shared fields were also updated for all languages." : ""}`;
  }
  if (outcome === "uncertain") return withKnown(`We could not confirm whether your ${language} ${action === "publish" ? "changes were published" : "draft was saved"}. Your edits are still here. Reload to check before trying again.`);
  if (outcome === "conflict") return withKnown(`Cannot continue in ${language}: this draft or its shared source changed. Reload the latest version.`);
  if (outcome === "no_draft") return withKnown(`Cannot publish ${language}: save your changes before publishing.`);
  if (outcome === "server") return withKnown(`Cannot ${action} ${language}: the server rejected the action. Your edits are still here.`);
  const own = groups.find(group => group.locale === locale)?.issues ?? [];
  const others = groups.filter(group => group.locale !== locale && group.issues.length).map(group => `${group.locale.toUpperCase()} (${group.issues.length})`);
  const first = own[0];
  const count = own.length;
  return `Cannot ${action} ${language}: fix ${count || "the"} ${count === 1 ? "error" : "errors"} in ${language}.${first ? ` First: ${language} → ${first.section ? `${first.section} → ` : ""}${first.label}.` : ""}${others.length ? ` Other known errors: ${others.join(", ")}.` : ""}`;
}
/** Known field errors only: file failures are described separately, never added as new counts. */
export function withOtherKnownErrors(message: string, locale: EditorLocale, groups: readonly FeedbackGroup[] = []): string {
  const fieldsByLocale = new Map<EditorLocale, Set<string>>();
  for (const group of groups) {
    if (group.locale === locale) continue;
    for (const issue of group.issues) {
      const fields = fieldsByLocale.get(group.locale) ?? new Set<string>();
      fields.add(issue.path);
      fieldsByLocale.set(group.locale, fields);
    }
  }
  const counts = [...fieldsByLocale].filter(([, paths]) => paths.size).map(([key, paths]) => `${key.toUpperCase()} (${paths.size})`);
  return `${message}${counts.length ? ` Other known errors: ${counts.join(", ")}.` : ""}`;
}
export function uploadFeedback(locale: EditorLocale, names: readonly string[], selectedLocales: readonly (EditorLocale | undefined)[] = [], knownGroups: readonly FeedbackGroup[] = []): string {
  const mixedOrigins = selectedLocales.some(selected => selected !== undefined && selected !== locale);
  const files = names.map((name, index) => {
    const origin = selectedLocales[index];
    return `“${name}”${mixedOrigins && origin ? ` (selected in ${origin.toUpperCase()}; required for this ${locale.toUpperCase()} draft)` : ""}`;
  });
  return withOtherKnownErrors(`Could not upload ${files.join(", ")} for ${locale.toUpperCase()}. Your ${locale.toUpperCase()} draft has not been saved. Retry the upload.`, locale, knownGroups);
}

/** Avoid exposing storage responses (signed URLs, headers, stacks) in the editor. */
export function uploadFailureCause(stage: "presign" | "put" | "finalize"): string {
  return stage === "presign" ? "Could not start the upload. Try again." : stage === "finalize" ? "The file was transferred, but could not be finalized. Try again." : "The file could not be transferred. Check your connection and try again.";
}
