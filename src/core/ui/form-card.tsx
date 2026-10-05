import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/**
 * Editorial "form card" primitives — a raised card `<form>` with hairline-titled field groups,
 * stacked label-over-control fields, an optional two-up row, collapsible optional sections
 * (`<details>` accordions) and a full-width accent submit button with a small centred note.
 * First built extracting Real Estate's "Submit Partnership Enquiry" form (`#deal-enquiry`,
 * SECTION 10 — the former `BODY_BOTTOM` raw markup in `real-estate-page.tsx`), ported 1:1 from
 * that page's `.mk`-scoped `.form-card`/`.fgroup`/`.fgroup-title`/`.fgroup-tag`/`.ffield`/
 * `.ftwo`/`.facc`/`.form-note` rules (old `PAGE_STYLE`, which match `mock/real-estate.html`
 * plus the live-only `.req`/`.fgroup-tag`/`.facc` additions) and `mock.css`'s `.btn.btn-accent`.
 *
 * Why not `OwnerEstimateForm` (slices/pages, Owners hero + Buildings calculator): a different
 * design and a different job — a compact 3-step wizard card driven by imperative
 * `data-wizard` hooks, with `h-11` inputs, 12px/`0.04em` labels, a custom select chevron, a
 * `rounded-md` `py-3` button and `transition-colors`. These primitives reproduce a different
 * spec (52px-tall `13px 14px`-padded controls with native select appearance, 12.5px/`0.03em`
 * labels, an 8px-radius card with a deep drop shadow, a `3px`-radius `14px 28px` button with
 * `transition: all .25s`), so bending that component would change both of its consumers.
 * There were no form primitives in `core/ui` before this file.
 *
 * Presentational only, per the `core/ui` ground rule: no i18n, no fetching, no submission
 * logic, no domain types — every string arrives pre-translated from the caller, and every
 * native attribute (`id`/`name`/`type`/`placeholder`/`required`/`autoComplete`…) is forwarded
 * untouched to the real `<input>`/`<select>`/`<textarea>`. `FormCard` is a plain `<form>` that
 * forwards all props, so a client caller can attach `onSubmit`/`action` (Real Estate's caller
 * is a tiny client wrapper that only calls `preventDefault()` — the form isn't wired yet).
 *
 * Typography inherits: the controls use Tailwind preflight's `font: inherit`, so their 24px
 * line box (15px × 1.6) comes from an ancestor's `line-height:1.6` — `EnquirySplit` sets it;
 * any other host must too (`leading-[1.6]`), or the controls render 1.5px shorter. Breakpoint:
 * `FormRow` stacks to one column ≤680px (the original's `max-width:680px`).
 *
 * MUST render **outside** any `.mk`-scoped subtree (`mock.css`'s un-layered
 * `.mk * { margin:0; padding:0 }` beats every `@layer`-wrapped Tailwind spacing utility — see
 * `SpecStrip`'s docstring / `docs/component-extraction-workflow.md` Lesson 1).
 */

/** The raised card `<form>` (surface, hairline border, 8px radius, deep soft drop shadow). */
export function FormCard({ className, children, ...props }: ComponentProps<"form">) {
  return (
    <form
      {...props}
      className={cn(
        "rounded-[8px] border border-line bg-surface px-[36px] pt-[38px] pb-[34px] [box-shadow:0_30px_60px_-34px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {children}
    </form>
  );
}

/** A titled field group: small uppercase accent title over a hairline, with an optional pill tag
 * (e.g. "Required") inline after the title. */
export function FormGroup({ title, tag, children }: { title: string; tag?: string; children: ReactNode }) {
  return (
    <div className="mb-[30px]">
      <div className="mb-[18px] border-b border-b-line pb-[10px] text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-deep">
        {title}
        {tag ? (
          <>
            {" "}
            <span className="ml-[8px] rounded-[30px] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] px-[9px] py-[3px] align-middle text-[10px] tracking-[0.1em]">
              {tag}
            </span>
          </>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Label-over-control field. `required` only draws the accent `*` marker (`aria-hidden` — the
 * control's own native `required` is what assistive tech announces); pass `required` on the
 * control too. */
export function FormField({
  htmlFor,
  label,
  required,
  children,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-[16px]">
      <label htmlFor={htmlFor} className="mb-[7px] block text-[12.5px] font-semibold tracking-[0.03em] text-ink">
        {label}
        {required ? (
          <>
            {" "}
            <span className="ml-px text-accent" aria-hidden="true">
              *
            </span>
          </>
        ) : null}
      </label>
      {children}
    </div>
  );
}

/** Two equal columns of fields (14px gap), one column ≤680px. */
export function FormRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-[14px] min-[681px]:grid-cols-2">{children}</div>;
}

/** Collapsible optional section: a bordered, `bg`-tinted `<details>` whose summary is a small
 * uppercase accent title, an optional soft hint pushed to the right, and a `+` that rotates to
 * `×` (45°) when open (the summary also gains a hairline under it). Closed by default. */
export function FormAccordion({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <details className="group/facc mb-[16px] overflow-hidden rounded-[6px] border border-line bg-bg">
      <summary className="flex cursor-pointer list-none items-center gap-[10px] px-[18px] py-[16px] text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-deep group-open/facc:border-b group-open/facc:border-b-line after:font-sans after:text-[20px] after:leading-none after:text-accent after:content-['+'] after:[transition:transform_0.25s_cubic-bezier(0.4,0,0.2,1)] group-open/facc:after:[transform:rotate(45deg)] [&::-webkit-details-marker]:hidden">
        {title}
        {hint ? (
          <>
            {" "}
            <span className="ml-auto text-[11px] font-medium normal-case tracking-[0.04em] text-ink-soft">{hint}</span>
          </>
        ) : null}
      </summary>
      <div className="px-[18px] pt-[22px] pb-[8px]">{children}</div>
    </details>
  );
}

const controlClass =
  "w-full rounded-[4px] border border-line bg-bg px-[14px] py-[13px] font-sans text-[15px] text-ink transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-accent focus:[box-shadow:0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus:[outline:none]";

/** Text-like `<input>` (all native props forwarded). */
export function FormInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(controlClass, className)} />;
}

/** Native-appearance `<select>` with a disabled, pre-selected empty `placeholder` option followed
 * by `options` (rendered as plain `<option>{text}</option>`, so each value is its text). */
export function FormSelect({
  placeholder,
  options,
  className,
  ...props
}: Omit<ComponentProps<"select">, "children" | "defaultValue" | "value"> & {
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <select {...props} defaultValue="" className={cn(controlClass, className)}>
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

/** `<textarea>` — vertically resizable, 110px minimum height. */
export function FormTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(controlClass, "min-h-[110px] resize-y", className)} />;
}

/** Full-width solid accent submit button (the original `.btn.btn-accent`; the label is rendered
 * as given — append any arrow in the string). */
export function FormSubmit({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-[6px] inline-flex w-full cursor-pointer items-center justify-center gap-[0.5em] rounded-[3px] border border-transparent bg-accent px-[28px] py-[14px] text-[14px] font-medium tracking-[0.01em] text-white transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent-deep"
    >
      {children}
    </button>
  );
}

/** Small centred soft note under the submit button. */
export function FormNote({ children }: { children: ReactNode }) {
  return <p className="mt-[14px] text-center text-[12.5px] text-ink-soft">{children}</p>;
}
