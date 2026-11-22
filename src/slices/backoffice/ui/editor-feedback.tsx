"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { EditorLocale } from "../page-editor-types";
import type { FeedbackGroup } from "./editor-feedback-copy";
export { feedbackMessage } from "./editor-feedback-copy";
export type { FeedbackIssue, FeedbackGroup, FeedbackAction, FeedbackOutcome, FeedbackMessageInput } from "./editor-feedback-copy";
export interface FeedbackScopeValue { locale: EditorLocale; entity: string; requiredPaths?: readonly string[]; errors?: Record<string, string> }
const FeedbackContext = createContext<FeedbackScopeValue | null>(null);
export function FeedbackScope({ children, ...scope }: FeedbackScopeValue & { children: ReactNode }) {
  return <FeedbackContext.Provider value={scope}>{children}</FeedbackContext.Provider>;
}
export function useFeedbackScope() { return useContext(FeedbackContext); }
export function feedbackTabProps(group?: FeedbackGroup) {
  const count = group?.issues.length ?? 0;
  const attention = count > 0 || Boolean(group?.uncertain);
  return {
    className: attention ? "outline-2 outline-offset-2 outline-red-600" : "",
    "aria-label": group && attention ? `${group.locale.toUpperCase()} — ${group.uncertain ? "publication not confirmed" : `${count} ${count === 1 ? "error" : "errors"}`}` : undefined,
    "data-feedback-invalid": attention ? true : undefined,
  };
}
export function EditorFeedbackSummary({ groups, onNavigate }: { groups: FeedbackGroup[]; onNavigate: (locale: EditorLocale, path: string) => void }) {
  const known = groups.filter(group => group.issues.length || group.notice || group.uncertain);
  if (!known.length) return null;
  return <section aria-label="Editor feedback" aria-live="polite" className="space-y-3 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink" data-editor-feedback-summary>
    {known.map(group => <div key={group.locale} className="space-y-1">
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
