"use client";

import { useEffect, useId, useRef } from "react";
import { useFeedbackScope } from "./editor-feedback";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@core/ui";

/**
 * Shared admin form primitives (S12). Presentational only — no `"use client"`, no
 * hooks — so they compose inside each slice's own client form islands (which own
 * the state + the server-action submit). Denser/neutral, on the same tokens as the
 * other admin primitives. The leads inbox predates these (it hand-rolled its few
 * controls); new CRUD screens (pages, buildings, apartments) build on these.
 */

/** Shared control surface used by text/select/textarea. */
export const controlClass =
  "w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

/** Labelled field wrapper: label, optional hint, the control, and an error line. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  errorPath,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  errorPath?: string;
  children: ReactNode;
  className?: string;
}) {
  const scope = useFeedbackScope();
  const fieldRef = useRef<HTMLDivElement>(null);
  const unique = useId();
  const messageId = `${unique}-error`;
  const actualError = error ?? (errorPath ? scope?.errors?.[errorPath] : undefined);
  const actualRequired = required ?? Boolean(errorPath && scope?.requiredPaths?.includes(errorPath));
  useEffect(() => {
    const controls = fieldRef.current?.querySelectorAll<HTMLElement>('input:not([type="hidden"]),textarea,select,[contenteditable="true"],button');
    if (!actualError || !controls) return;
    const previous = [...controls].map(control => ({ control, invalid: control.getAttribute("aria-invalid"), described: control.getAttribute("aria-describedby") }));
    for (const { control, described } of previous) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", [described, messageId].filter(Boolean).join(" "));
    }
    return () => { for (const { control, invalid, described } of previous) {
      if (invalid === null) control.removeAttribute("aria-invalid"); else control.setAttribute("aria-invalid", invalid);
      if (described === null) control.removeAttribute("aria-describedby"); else control.setAttribute("aria-describedby", described);
    } };
  }, [actualError, messageId, children]);
  return (
    <div ref={fieldRef} data-feedback-path={errorPath} data-field-invalid={actualError ? true : undefined} className={cn("space-y-1.5", actualError && "[&_input]:border-red-600 [&_textarea]:border-red-600 [&_select]:border-red-600 [&_button]:border-red-600 [&_[contenteditable]]:outline-2 [&_[contenteditable]]:outline-red-600", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {label}
          {actualRequired ? <span className="ml-0.5 text-accent-deep">*</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !actualError ? <p className="text-xs text-ink-soft/80">{hint}</p> : null}
      {actualError ? <p id={messageId} className="text-xs font-medium text-red-600">{actualError}</p> : null}
    </div>
  );
}

/** Single-line text/number/url input. */
export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

/** Multi-line text input; defaults to a comfortable 3 rows. */
export function TextArea({ className, rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(controlClass, "resize-y", className)} {...props} />;
}

/** Native select (no external dropdown lib — matches the leads status control). */
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

/** Inline checkbox with a label to its right. */
export function Checkbox({
  label,
  className,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-sm text-ink", className)}>
      <input
        type="checkbox"
        className="size-4 rounded border-line text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        {...props}
      />
      {label}
    </label>
  );
}

type ButtonVariant = "primary" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white hover:bg-accent-deep",
  ghost: "border-line text-ink hover:border-ink",
  danger: "border-red-200 text-red-700 hover:border-red-400",
};

/** Admin action button. Defaults to the neutral ghost style. */
export function AdminButton({
  variant = "ghost",
  className,
  type = "button",
  ...props
}: { variant?: ButtonVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Responsive two-column grid for grouping related fields. */
export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

/** Sticky-ish action row at the foot of a form (save / cancel + status). */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4", className)}>
      {children}
    </div>
  );
}
