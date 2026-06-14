"use client";
import { useId, useState, useTransition, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { cn } from "@core/ui";
import { submitLead } from "../../server/actions";
import type { LeadSubmission } from "../../validation";
import type { LeadActionResult } from "../../types";

/**
 * Client form primitives + submit hook shared by the four lead forms (slice
 * `leads`). Inputs are controlled; labels/messages are passed in by each form from
 * `useTranslations("leads")`. The hook injects `locale` (from next-intl) +
 * `source_page` and posts through the `submitLead` server action.
 */

const inputClass =
  "w-full rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs text-accent-deep">{error}</p> : null}
    </div>
  );
}

export function TextField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} required={required} error={error}>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

export function NumberField(props: Omit<Parameters<typeof TextField>[0], "type">) {
  return <TextField {...props} type="number" />;
}

export function TextAreaField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  rows = 4,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  rows?: number;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} required={required} error={error}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "resize-y")}
      />
    </Field>
  );
}

export function ConsentCheckbox({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  error?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <input
          id={id}
          type="checkbox"
          required
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-line text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <span>{label}</span>
      </label>
      {error ? <p className="mt-1 text-xs text-accent-deep">{error}</p> : null}
    </div>
  );
}

/** Off-screen honeypot — real users never fill it; bots usually do. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this field empty
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

export function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function FormStatus({ kind, message }: { kind: "ok" | "error"; message: string }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-4 py-3 text-sm",
        kind === "ok"
          ? "bg-accent/10 text-accent-deep"
          : "border border-accent/40 bg-accent/5 text-accent-deep",
      )}
    >
      {message}
    </p>
  );
}

/** Distributes `Omit` across the discriminated union so `kind`↔`fields` stay paired. */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type LeadFormPayload = DistributiveOmit<LeadSubmission, "locale" | "source_page">;

/**
 * Form-state hook: injects `locale` + `source_page`, posts through `submitLead`,
 * and exposes pending / status / per-field errors. Each form calls `submit` with
 * its kind-specific payload (and the honeypot value).
 */
export function useLeadForm(source: string) {
  const locale = useLocale() as LeadSubmission["locale"];
  const [pending, start] = useTransition();
  const [result, setResult] = useState<LeadActionResult | null>(null);

  function submit(payload: LeadFormPayload, honeypot: string) {
    start(async () => {
      const submission = { ...payload, locale, source_page: source } as LeadSubmission;
      setResult(await submitLead(submission, honeypot));
    });
  }

  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  const status: "idle" | "ok" | "error" = !result ? "idle" : result.ok ? "ok" : "error";
  return { pending, status, fieldErrors, submit };
}
