"use client";
import { useId, useState, useTransition, type ComponentProps } from "react";
import { useLocale } from "next-intl";
import {
  cn,
  FormCard,
  FormCheckbox,
  FormField,
  FormInput,
  FormMessage,
  FormSubmit,
  FormTextarea,
  FormToneScope,
  type FormTone,
} from "@core/ui";
import { submitLead } from "../../server/actions";
import type { LeadSubmission } from "../../validation";
import type { LeadActionResult } from "../../types";

/**
 * Client form pieces + submit hook shared by the four lead forms (slice `leads`).
 *
 * Since the form-style unification (user-approved; same pattern as Owners' `OwnerEstimateForm`)
 * these are **thin wrappers over `core/ui`'s form-card primitives** (`FormCard`, `FormField`,
 * `FormInput`, `FormTextarea`, `FormCheckbox`, `FormSubmit`, `FormMessage`, `FormToneScope`) — so
 * every lead form now looks like Real Estate's `#deal-enquiry` / the Owners wizard. The wrappers
 * only add the lead-specific wiring: a `useId` id per control, controlled `value` →
 * `onChange(string)`, and the server's per-field error (`aria-invalid` + `aria-describedby` →
 * the `FormField` error line). Inputs are controlled; labels/messages are passed in by each form
 * from `useTranslations("leads")`. The hook injects `locale` (from next-intl) + `source_page` and
 * posts through the `submitLead` server action — unchanged.
 *
 * Tone: `LeadFormShell tone="dark"` (and `LeadFormStatus tone="dark"` for the success message
 * that replaces the form) switch the primitives to their on-feature colours, so a form can sit
 * on a dark band (the blog newsletter on `bg-feature`). Layout is shared; only colours change.
 */

/** The `<form>` every lead form renders: a `FormCard` (raised card by default; `bare` drops the
 * card chrome for hosts that draw their own container), with the `leading-[1.6]` line box the
 * form-card controls need (see `core/ui/form-card.tsx`). */
export function LeadFormShell({
  tone = "light",
  bare = false,
  className,
  ...props
}: ComponentProps<"form"> & { tone?: FormTone; bare?: boolean }) {
  return <FormCard {...props} tone={tone} bare={bare} className={cn("leading-[1.6]", className)} />;
}

type TextFieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
};

export function TextField({ name, label, value, onChange, error, required, type = "text", placeholder, autoComplete }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <FormField htmlFor={id} label={label} required={required} error={error} errorId={errorId}>
      <FormInput
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

export function NumberField(props: Omit<TextFieldProps, "type">) {
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
  const errorId = `${id}-error`;
  return (
    <FormField htmlFor={id} label={label} required={required} error={error} errorId={errorId}>
      <FormTextarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

/** The mandatory consent line (`required` — the browser blocks submit until it's ticked). */
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
  const errorId = `${id}-error`;
  return (
    <FormCheckbox
      id={id}
      required
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      error={error}
      errorId={errorId}
    >
      {label}
    </FormCheckbox>
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

/** Full-width accent submit; disabled (dimmed) and relabelled while the submission is pending. */
export function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return <FormSubmit disabled={pending}>{pending ? pendingLabel : label}</FormSubmit>;
}

/** Submit outcome (`FormMessage`). Inside a form it sits above the submit button; on success it
 * replaces the form, so pass that form's `tone` (it's then outside the toned `<form>`). */
export function FormStatus({
  kind,
  message,
  tone,
  className,
}: {
  kind: "ok" | "error";
  message: string;
  tone?: FormTone;
  className?: string;
}) {
  const box = (
    <FormMessage kind={kind} className={className}>
      {message}
    </FormMessage>
  );
  return tone ? <FormToneScope tone={tone}>{box}</FormToneScope> : box;
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
