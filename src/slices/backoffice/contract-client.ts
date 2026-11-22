/** Explicit client-safe editorial feedback entrypoint. No server actions or auth imports. */
export { FeedbackScope, useFeedbackScope, EditorFeedbackSummary, feedbackTabProps, focusEditorField, useEditorFeedbackToast } from "./ui/editor-feedback";
export { feedbackMessage, uploadFeedback, uploadFailureCause } from "./ui/editor-feedback-copy";
export type { FeedbackIssue, FeedbackGroup, FeedbackAction, FeedbackOutcome, FeedbackMessageInput } from "./ui/editor-feedback-copy";
export type { FeedbackScopeValue } from "./ui/editor-feedback";
