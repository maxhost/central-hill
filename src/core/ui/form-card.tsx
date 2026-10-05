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
 * Second consumer (a deliberate, user-approved style unification, not a pixel-identical
 * extraction): `OwnerEstimateForm` (slices/pages — the Owners hero's 3-step wizard + Buildings'
 * earnings calculator) was rebuilt on these primitives and adopted their look. That added the
 * pieces the wizard needed and Real Estate didn't — all **additive**, Real Estate's render is
 * unchanged (verified numerically, 1440/834/390):
 * - `FormButton` (the same accent button, any `type`, no forced width/margin; `FormSubmit` is
 *   now that button with `type="submit"` + full width);
 * - `FormStepper` (controlled − value + number field), `FormCheckbox` (consent line),
 *   `FormProgress` (wizard step bars);
 * - `FormSelect` gained optional `placeholder`, `{ value, label }` options, `defaultValue`/`value`
 *   and an opt-in custom `chevron`; `FormField` gained optional `htmlFor` + `labelId` (for
 *   labelling a non-labelable control like `FormStepper`); `FormRow` gained `stack={false}`.
 *
 * Controlled-friendly by design (the leads slice's forms are the expected third consumer): every
 * control forwards native props, so `value`/`onChange`/`checked` work as on the raw element, and
 * the one stateful control (`FormStepper`) is purely controlled — the caller owns the number.
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
 * control too. `htmlFor` ties the label to a labelable control; for a composite that isn't one
 * (e.g. `FormStepper`, a `role="group"`), omit it and pass `labelId`, then point the control's
 * `aria-labelledby` at that id. */
export function FormField({
  htmlFor,
  labelId,
  label,
  required,
  children,
}: {
  htmlFor?: string;
  labelId?: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-[16px]">
      <label
        id={labelId}
        htmlFor={htmlFor}
        className="mb-[7px] block text-[12.5px] font-semibold tracking-[0.03em] text-ink"
      >
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

/** Two equal columns of fields (14px gap), one column ≤680px — unless `stack={false}`, which keeps
 * the two columns at every width (for short paired controls in a narrow card, e.g. a stepper
 * beside a select). */
export function FormRow({ stack = true, children }: { stack?: boolean; children: ReactNode }) {
  return (
    <div className={stack ? "grid grid-cols-1 gap-[14px] min-[681px]:grid-cols-2" : "grid grid-cols-2 gap-[14px]"}>
      {children}
    </div>
  );
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

/** A `FormSelect` option: a bare string (rendered `<option>{text}</option>`, so its value is its
 * text) or an explicit `{ value, label }` pair. */
export type FormSelectOption = string | { value: string; label: string };

/** `<select>` (all other native props forwarded, so it works controlled — `value`/`onChange` — or
 * uncontrolled — `defaultValue`).
 *
 * - With a `placeholder`: a disabled empty first option, pre-selected unless the caller passes
 *   its own `value`/`defaultValue` (Real Estate's original behaviour).
 * - Without one: just the `options`; the browser selects the first unless told otherwise.
 * - `chevron`: `appearance-none` + an inline-SVG soft-ink chevron at the right (the select
 *   keeps the same 52px box as `FormInput`; the native menulist renders ~4px shorter and with an
 *   OS-dependent arrow). Off by default — Real Estate's selects stay native. */
export function FormSelect({
  placeholder,
  options,
  chevron = false,
  className,
  ...props
}: Omit<ComponentProps<"select">, "children"> & {
  placeholder?: string;
  options: readonly FormSelectOption[];
  chevron?: boolean;
}) {
  const placeholderDefault =
    placeholder !== undefined && props.value === undefined ? { defaultValue: props.defaultValue ?? "" } : null;
  const select = (
    <select {...props} {...placeholderDefault} className={cn(controlClass, chevron && "appearance-none pr-[40px]", className)}>
      {placeholder !== undefined ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o}>{o}</option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  );
  if (!chevron) return select;
  return (
    <div className="relative">
      {select}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute inset-y-0 right-[14px] my-auto h-[15px] w-[15px] text-ink-soft"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/** `<textarea>` — vertically resizable, 110px minimum height. */
export function FormTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(controlClass, "min-h-[110px] resize-y", className)} />;
}

const accentButtonClass =
  "inline-flex cursor-pointer items-center justify-center gap-[0.5em] rounded-[3px] border border-transparent bg-accent px-[28px] py-[14px] text-[14px] font-medium tracking-[0.01em] text-white transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent-deep";

/** The solid accent button (the original `.btn.btn-accent`) as a plain `<button>` — `type`
 * defaults to `"button"` (e.g. wizard "next" steps), every native prop forwarded, `className`
 * appended for layout (width/margin; it has none of its own). The label is rendered as given —
 * append any arrow in the string. */
export function FormButton({ type = "button", className, ...props }: ComponentProps<"button">) {
  return <button {...props} type={type} className={cn(accentButtonClass, className)} />;
}

/** Full-width solid accent submit button (`FormButton` with `type="submit"`, full width, 6px top
 * margin; the label is rendered as given — append any arrow in the string). */
export function FormSubmit({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className={cn("mt-[6px] w-full", accentButtonClass)}>
      {children}
    </button>
  );
}

/** Small centred soft note under the submit button. */
export function FormNote({ children }: { children: ReactNode }) {
  return <p className="mt-[14px] text-center text-[12.5px] text-ink-soft">{children}</p>;
}

/** Checkbox line (e.g. consent): a 16px native checkbox tinted with the accent, beside soft-ink
 * 13px copy, the **whole line a `<label>`** so clicking the text toggles it. `children` is the
 * label copy (may contain links — style them at the call site) and is wrapped in one `<span>` so
 * inline links don't become separate flex items. Every native `<input>` prop is forwarded
 * (`name`, `required`, `checked`/`onChange` for controlled use, `defaultChecked`…); `type` is
 * fixed. `className` is appended to the `<label>`. */
export function FormCheckbox({
  children,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type" | "children"> & { children: ReactNode }) {
  return (
    <label className={cn("mb-[12px] flex cursor-pointer items-start gap-[10px] text-[13px] leading-[1.5] text-ink-soft", className)}>
      <input
        {...props}
        type="checkbox"
        className="mt-[2px] h-[16px] w-[16px] flex-none cursor-pointer accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      <span>{children}</span>
    </label>
  );
}

const stepButtonClass =
  "flex h-[44px] w-[44px] flex-none cursor-pointer items-center justify-center rounded-[3px] text-ink transition-colors duration-200 ease-in-out hover:bg-accent/14 hover:text-accent-deep focus-visible:bg-accent/14 focus-visible:text-accent-deep focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ink disabled:opacity-35";

/** Number field with − / + buttons — **controlled** (`value` + `onChange(next)`), clamped to
 * `min`…`max` (`max` optional = unbounded); the − / + button is `disabled` at the bound. Same
 * 52px box, hairline border, `bg` fill and accent focus halo (shown while a button has
 * keyboard focus) as `FormInput`. A `role="group"` — label it with `aria-labelledby` (see
 * `FormField`'s `labelId`); each button needs its own accessible name
 * (`decrementLabel`/`incrementLabel`, pre-translated). With `name` it also renders
 * `<input type="hidden" name value>` (+ `id`) so the count posts with the form. The value is
 * `aria-live="polite"` so the new number is announced. Extra props (e.g. `data-*`,
 * `aria-labelledby`) go on the group `<div>`; the buttons carry `data-step="down"|"up"`. */
export function FormStepper({
  value,
  onChange,
  min = 0,
  max,
  name,
  id,
  decrementLabel,
  incrementLabel,
  className,
  ...props
}: Omit<ComponentProps<"div">, "onChange" | "children" | "id"> & {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  name?: string;
  id?: string;
  decrementLabel: string;
  incrementLabel: string;
}) {
  const clamp = (n: number) => Math.max(min, max === undefined ? n : Math.min(max, n));
  return (
    <div
      role="group"
      {...props}
      className={cn(
        "flex h-[52px] items-center justify-between rounded-[4px] border border-line bg-bg px-[3px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] has-[:focus-visible]:border-accent has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-accent/18",
        className,
      )}
    >
      <button
        type="button"
        data-step="down"
        disabled={value <= min}
        aria-label={decrementLabel}
        onClick={() => onChange(clamp(value - 1))}
        className={stepButtonClass}
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-[16px] w-[16px]">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span aria-live="polite" className="flex-1 text-center font-sans text-[15px] font-semibold text-ink">
        {value}
      </span>
      <button
        type="button"
        data-step="up"
        disabled={max !== undefined && value >= max}
        aria-label={incrementLabel}
        onClick={() => onChange(clamp(value + 1))}
        className={stepButtonClass}
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-[16px] w-[16px]">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {name ? <input type="hidden" id={id} name={name} value={value} readOnly /> : null}
    </div>
  );
}

/** Wizard progress: `steps` equal 3px bars in a row (6px gap), bars `1…current` filled with the
 * accent, the rest hairline, colour easing over 300ms as `current` changes. Decorative
 * (`aria-hidden`) — announce the step in copy if needed. Each bar carries `data-dot="<n>"`
 * (1-based) as a stable test hook. `className` is appended (spacing). */
export function FormProgress({ steps, current, className }: { steps: number; current: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex gap-[6px]", className)}>
      {Array.from({ length: steps }, (_, i) => (
        <span
          key={i}
          data-dot={i + 1}
          className={cn(
            "h-[3px] flex-1 rounded-[2px] transition-colors duration-300 ease-in-out",
            i < current ? "bg-accent" : "bg-line",
          )}
        />
      ))}
    </div>
  );
}
