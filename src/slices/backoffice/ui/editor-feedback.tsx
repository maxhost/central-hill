"use client";
import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import type { EditorLocale } from "../page-editor-types";
import { useToast, type ToastApi, type ToastOptions } from "./toast";
import type { FeedbackGroup } from "./editor-feedback-copy";
export { feedbackMessage } from "./editor-feedback-copy";
export type { FeedbackIssue, FeedbackGroup, FeedbackAction, FeedbackOutcome, FeedbackMessageInput } from "./editor-feedback-copy";
export interface FeedbackScopeValue { locale: EditorLocale; entity: string; requiredPaths?: readonly string[]; errors?: Record<string, string> }
const FeedbackContext = createContext<FeedbackScopeValue | null>(null);
export function FeedbackScope({ children, ...scope }: FeedbackScopeValue & { children: ReactNode }) {
  return <FeedbackContext.Provider value={scope}>{children}</FeedbackContext.Provider>;
}
export function useFeedbackScope() { return useContext(FeedbackContext); }
export function feedbackTabProps(group?: FeedbackGroup, summaryId = "editor-feedback") {
  const count = group?.issues.length ?? 0;
  const attention = count > 0 || Boolean(group?.uncertain);
  return {
    className: attention ? "ring-2 ring-red-600 ring-offset-2 ring-offset-surface" : "",
    "aria-label": group && attention ? `${group.locale.toUpperCase()} — ${group.uncertain ? "action not confirmed" : `${count} ${count === 1 ? "error" : "errors"}`}` : undefined,
    "data-feedback-invalid": attention ? true : undefined,
    "aria-describedby": group && attention ? `${summaryId}-${group.locale}` : undefined,
  };
}
export function EditorFeedbackSummary({ groups, onNavigate, id = "editor-feedback" }: { groups: FeedbackGroup[]; id?: string; onNavigate: (locale: EditorLocale, path: string) => void }) {
  const known = groups.filter(group => group.issues.length || group.notice || group.uncertain);
  if (!known.length) return null;
  return <section aria-label="Editor feedback" aria-live="polite" className="max-h-[40vh] space-y-3 overflow-y-auto rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink" data-editor-feedback-summary>
    {known.map(group => <div key={group.locale} id={`${id}-${group.locale}`} className="space-y-1">
      <h2 className="font-semibold">{group.locale.toUpperCase()}{group.issues.length ? ` — ${group.issues.length} ${group.issues.length === 1 ? "error" : "errors"}` : ""}</h2>
      {group.notice ? <p>{group.notice}</p> : null}
      {group.issues.length ? <ul className="space-y-1">{group.issues.map(issue => <li key={issue.path}>
        <button type="button" className="text-left text-red-700 underline decoration-red-300 underline-offset-2 hover:decoration-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" onClick={() => onNavigate(group.locale, issue.path)}>
          {group.locale.toUpperCase()} → {issue.section ? `${issue.section} → ` : ""}{issue.label}: {issue.message}{issue.sourceLocale && issue.sourceLocale !== group.locale ? ` Shared field — managed in ${issue.sourceLocale.toUpperCase()}.` : ""}
        </button>
      </li>)}</ul> : null}
    </div>)}
  </section>;
}

/** Reveals an actual form control; rich text also receives its exact block selection. */
export function focusEditorField(root: HTMLElement | null, path: string): boolean {
  const fields = Array.from(root?.querySelectorAll<HTMLElement>("[data-feedback-path],[data-post-body-path]") ?? []);
  const field = fields.find(field => field.dataset.feedbackPath === path || field.dataset.postBodyPath === path) ?? fields.filter(field => path.startsWith(`${field.dataset.feedbackPath}.`)).sort((a, b) => (b.dataset.feedbackPath?.length ?? 0) - (a.dataset.feedbackPath?.length ?? 0))[0];
  if (!field) return false;
  const rich = field.closest<HTMLElement>("[data-post-rich-text-container]");
  const actual = field.matches('input,textarea,select,[contenteditable="true"]') ? field : field.querySelector<HTMLElement>('input:not([type="file"]):not([disabled]),textarea:not([disabled]),select:not([disabled]),[contenteditable="true"],button:not([disabled])');
  field.scrollIntoView({ block: "center", behavior: "auto" });
  if (rich && (!actual || actual.isContentEditable)) { rich.dispatchEvent(new CustomEvent("editor-feedback-focus", { detail: { path } })); return true; }
  if (actual) { actual.focus({ preventScroll: true }); return true; }
  return false;
}

/** One editorial action toast at a time, using the existing global ToastProvider. */
export function useEditorFeedbackToast(): ToastApi {
  const toast = useToast();
  const previous = useRef<string | null>(null);
  return useMemo(() => {
    const show = (message: string, options?: ToastOptions) => {
      if (previous.current) toast.dismiss(previous.current);
      const id = toast.show(message, options);
      previous.current = id;
      return id;
    };
    return { show, dismiss: toast.dismiss,
      success: (message, options) => show(message, { ...options, variant: "success" }),
      error: (message, options) => show(message, { ...options, variant: "error" }),
      info: (message, options) => show(message, { ...options, variant: "info" }),
      warning: (message, options) => show(message, { ...options, variant: "warning" }),
    };
  }, [toast]);
}
