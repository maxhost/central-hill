import type { ReactNode } from "react";
import { cn } from "@core/ui";

/**
 * The Owners-hero "earnings estimate" card — ported from the `.mk`-scoped `.est-card`/
 * `.wiz-*` CSS (formerly in `owners-page.tsx`'s `OWNERS_STYLE`) to Tailwind, 1:1, as part
 * of moving the Owners hero onto the shared `core/ui` `<Hero aside=…>` slot. Values that map
 * cleanly onto Tailwind's rem scale use it (`rounded`, `px-3.5`, `mb-4`, …); the handful
 * that don't (an exact `box-shadow`, the native `<select>` chevron) are reproduced via
 * arbitrary values / an inline SVG rather than approximated.
 *
 * Pure markup + the 3-step panel/stepper DOM contract (`data-wizard`/`data-panel`/
 * `data-dot`/`data-stepper`/`data-step`/`data-wiz-next`/`data-wiz-back`) that
 * `EstFormWizard`/`EstFormStepper` (client islands) wire up imperatively via
 * `document.querySelector` — unchanged by this rewrite, so no submission logic lives here
 * (still markup-only, see the slice README).
 */

const inputClass =
  "h-11 w-full rounded border border-line bg-bg px-3.5 text-[15px] text-ink transition-colors duration-200 ease-in-out focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/[0.18]";

const stepBtnClass =
  "flex h-9 w-9 flex-none items-center justify-center rounded text-ink transition-colors duration-200 ease-in-out hover:bg-accent/[0.14] hover:text-accent-deep disabled:cursor-not-allowed disabled:opacity-35";

// Mirrors `core/ui/button.tsx`'s `primary` variant exactly (ContactDialog's own variants
// duplicate it the same way) — a plain `<button>` is required here for wizard-step
// navigation, not a link, so `ButtonLink` doesn't fit.
const primaryBtnClass =
  "inline-flex items-center justify-center rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-[7px] block text-xs font-semibold tracking-[0.04em] text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectChevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-ink-soft)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("pointer-events-none absolute top-1/2 h-[15px] w-[15px] -translate-y-1/2", className)}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckLine({ children }: { children: ReactNode }) {
  return (
    <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-ink-soft">
      <input type="checkbox" className="mt-0.5 h-4 w-4 flex-none accent-accent" />
      {children}
    </label>
  );
}

const PHONE_CODES = [
  { value: "+351", label: "🇵🇹 +351" },
  { value: "+34", label: "🇪🇸 +34" },
  { value: "+33", label: "🇫🇷 +33" },
  { value: "+44", label: "🇬🇧 +44" },
  { value: "+49", label: "🇩🇪 +49" },
  { value: "+1", label: "🇺🇸 +1" },
  { value: "+55", label: "🇧🇷 +55" },
];

export function OwnerEstimateForm({
  badge,
  headline,
  subheadline,
  ctaLabel,
  note,
}: {
  badge?: string;
  headline: string;
  subheadline?: string;
  ctaLabel: string;
  note?: string;
}) {
  return (
    <form
      data-wizard
      data-step="1"
      className="rounded-lg border border-line bg-surface px-8 pt-[34px] pb-[30px] text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]"
    >
      <div aria-hidden className="mb-[22px] flex gap-1.5">
        <span data-dot="1" className="h-[3px] flex-1 rounded-sm bg-accent transition-colors duration-300 ease-in-out" />
        <span data-dot="2" className="h-[3px] flex-1 rounded-sm bg-line transition-colors duration-300 ease-in-out" />
        <span data-dot="3" className="h-[3px] flex-1 rounded-sm bg-line transition-colors duration-300 ease-in-out" />
      </div>

      <div data-panel="1">
        {badge ? (
          <span className="mb-4 inline-flex items-center gap-[0.5em] rounded-full bg-accent px-[18px] py-[9px] text-[13px] font-bold uppercase tracking-[0.09em] text-white shadow-[0_10px_24px_-10px_color-mix(in_srgb,var(--color-accent)_75%,transparent)]">
            ★ {badge}
          </span>
        ) : null}
        <h3 className="mb-2 text-[26px]">{headline}</h3>
        {subheadline ? <p className="mb-[22px] text-sm text-ink-soft">{subheadline}</p> : null}

        <Field label="Property Address" htmlFor="addr">
          <input id="addr" type="text" placeholder="Street, neighbourhood, city" autoComplete="off" className={inputClass} />
        </Field>

        <div className="mb-4 grid grid-cols-2 gap-3.5">
          <Field label="Nº of Properties">
            <div
              data-stepper
              data-value="1"
              data-min="1"
              className="flex h-11 items-center justify-between rounded border border-line bg-bg px-[3px]"
            >
              <button
                type="button"
                data-step="down"
                disabled
                aria-label="Decrease number of properties"
                className={stepBtnClass}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <span className="step-val flex-1 text-center text-[15px] font-semibold text-ink">1</span>
              <button type="button" data-step="up" aria-label="Increase number of properties" className={stepBtnClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <input type="hidden" id="nprop" name="nprop" value="1" readOnly />
            </div>
          </Field>
          <Field label="Nº of Bedrooms" htmlFor="nbed">
            <div className="relative">
              <select id="nbed" className={cn(inputClass, "appearance-none pr-[34px]")}>
                <option>Studio</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6+</option>
              </select>
              <SelectChevron className="right-3" />
            </div>
          </Field>
        </div>

        <button type="button" data-wiz-next className={cn(primaryBtnClass, "mt-1.5 w-full justify-center")}>
          {ctaLabel} →
        </button>
        {note ? <p className="mt-3.5 text-center text-[12.5px] font-medium text-ink">{note}</p> : null}
      </div>

      <div data-panel="2" hidden>
        <h3 className="mb-2 text-[26px]">Your contact details</h3>
        <p className="mb-[22px] text-sm text-ink-soft">Almost there — tell us how to reach you with the study.</p>

        <Field label="Full Name" htmlFor="fname">
          <input id="fname" type="text" placeholder="Jane Doe" autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="femail">
          <input id="femail" type="email" placeholder="jane@example.com" autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Phone" htmlFor="fphone">
          <div className="flex gap-2.5">
            <div className="relative w-[112px] flex-none">
              <select
                id="fphone-code"
                aria-label="Country code"
                defaultValue="+351"
                className={cn(inputClass, "w-full appearance-none pl-3 pr-[30px]")}
              >
                {PHONE_CODES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <SelectChevron className="right-[9px]" />
            </div>
            <input
              id="fphone"
              type="tel"
              placeholder="912 345 678"
              autoComplete="tel"
              className={cn(inputClass, "min-w-0 flex-1")}
            />
          </div>
        </Field>

        <CheckLine>
          I agree to the{" "}
          <a href="#" className="text-ink underline underline-offset-2">
            Terms &amp; Conditions
          </a>
          .
        </CheckLine>
        <CheckLine>
          I agree to the{" "}
          <a href="#" className="text-ink underline underline-offset-2">
            Privacy Policy
          </a>{" "}
          and consent to being contacted.
        </CheckLine>

        <div className="mt-1.5 flex items-center gap-3.5">
          <button
            type="button"
            data-wiz-back
            className="flex-none border-0 bg-transparent p-0 text-[13px] font-semibold text-ink-soft transition-colors hover:text-accent-deep"
          >
            ← Back
          </button>
          <button type="button" data-wiz-next className={primaryBtnClass}>
            Submit request →
          </button>
        </div>
      </div>

      <div data-panel="3" hidden>
        <div className="pt-[18px] pb-1.5 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-[18px] inline-block h-[46px] w-[46px] rounded-full border border-line p-3 text-accent"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <h3 className="mb-2.5 text-[26px]">Request received</h3>
          <p className="text-[14.5px] leading-[1.6] text-ink-soft">
            Thank you — our team will review your property and get back to you within 48 hours with your
            free profitability study.
          </p>
        </div>
      </div>
    </form>
  );
}
