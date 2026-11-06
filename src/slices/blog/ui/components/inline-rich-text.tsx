import { Fragment, type ReactNode } from "react";
import { isSafeInlineHref, type InlineTextRun } from "../../body";

/** Defensive rendering also covers legacy/unvalidated callers. React escapes all text. */
export function InlineRichText({ text, runs }: { text: string; runs?: InlineTextRun[] }) {
  if (!runs || runs.map(run => run.text).join("") !== text) return <>{text}</>;
  return <>{runs.map((run, index) => {
    let content: ReactNode = run.text;
    if (run.italic) content = <em>{content}</em>;
    if (run.bold) content = <strong>{content}</strong>;
    if (run.href && isSafeInlineHref(run.href)) content = <a href={run.href} className="underline underline-offset-2">{content}</a>;
    return <Fragment key={index}>{content}</Fragment>;
  })}</>;
}
