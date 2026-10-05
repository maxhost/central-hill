"use client";

import { useState } from "react";
import {
  FormButton,
  FormCard,
  FormCheckbox,
  FormField,
  FormInput,
  FormNote,
  FormProgress,
  FormRow,
  FormSelect,
  FormStepper,
} from "@core/ui";

/**
 * The Owners-hero "earnings estimate" card — a 3-step wizard (1: property, 2: contact details,
 * 3: "Request received"), built on `core/ui`'s `form-card.tsx` primitives and styled like them
 * (the same field/label/control/button/focus look as Real Estate's `#deal-enquiry` form — a
 * deliberate, user-approved style unification; it used to carry its own `h-11`-input design).
 *
 * Structure, copy and behaviour are unchanged from the pre-unification version: same steps,
 * fields, ids/names/types/placeholders/options, same initial state (step 1, 1 property,
 * "Studio", "+351"), same navigation (Next → / ← Back, clamped 1…3, no validation — nothing is
 * `required`), the − / + count never below 1 (no max), and it still **submits nothing** (no
 * `submitLead`; a real `submit` — e.g. Enter in a field — is cancelled). The step/count state
 * is plain React state here; it used to be two DOM islands (`EstFormWizard`/`EstFormStepper`)
 * that wired the server markup up via `document.querySelector` — retired with this rewrite.
 * The old hook attributes (`data-wizard`/`data-step`/`data-panel`/`data-dot`/`data-stepper`/
 * `data-value`/`data-min`/`data-step="up|down"`/`data-wiz-next`/`data-wiz-back`) are kept on the
 * same elements, now just as stable markers.
 *
 * Layout decisions not covered by `form-card` (see the slice README): `FormCard`'s own padding
 * and shadow are used as-is in both hosts; the card sets `text-ink` (the Owners hero is
 * `text-surface`) and `leading-[1.6]` (the controls' 52px box needs a 1.6 line box — see
 * `form-card.tsx`), while the step headings/badge pin their previous `leading-[1.5]`. The
 * properties/bedrooms pair stays two-up at every width (`FormRow stack={false}`), as before.
 *
 * Second consumer: Buildings' listing "earnings calculator" (`buildings-listing.tsx`) —
 * exported via `pages/contract.ts` since that's a different slice (golden rule 2). Only
 * step 1's copy (`badge`/`headline`/`subheadline`/`ctaLabel`/`note`) is parameterized because
 * that's the only part that ever differed between the two pages' original markup; steps 2
 * ("Your contact details") and 3 ("Request received") were already byte-for-byte identical
 * on both, so they stay fixed here rather than becoming props nobody would vary. Copy is
 * hardcoded English (as before — not i18n'd; step 1's comes from the caller).
 */

const STEPS = 3;

const PHONE_CODES = [
  { value: "+351", label: "🇵🇹 +351" },
  { value: "+34", label: "🇪🇸 +34" },
  { value: "+33", label: "🇫🇷 +33" },
  { value: "+44", label: "🇬🇧 +44" },
  { value: "+49", label: "🇩🇪 +49" },
  { value: "+1", label: "🇺🇸 +1" },
  { value: "+55", label: "🇧🇷 +55" },
];

const BEDROOMS = ["Studio", "1", "2", "3", "4", "5", "6+"];

const headingClass = "mb-2 text-[26px] leading-[1.5]";
const ledeClass = "mb-[22px] text-sm text-ink-soft";
const linkClass = "text-ink underline underline-offset-2";

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
  const [step, setStep] = useState(1);
  const [properties, setProperties] = useState(1);
  const next = () => setStep((s) => Math.min(STEPS, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <FormCard data-wizard data-step={step} onSubmit={(e) => e.preventDefault()} className="leading-[1.6] text-ink">
      <FormProgress steps={STEPS} current={step} className="mb-[22px]" />

      <div data-panel="1" hidden={step !== 1}>
        {badge ? (
          <span className="mb-4 inline-flex items-center gap-[0.5em] rounded-full bg-accent px-[18px] py-[9px] text-[13px] leading-[1.5] font-bold uppercase tracking-[0.09em] text-white shadow-[0_10px_24px_-10px_color-mix(in_srgb,var(--color-accent)_75%,transparent)]">
            ★ {badge}
          </span>
        ) : null}
        <h3 className={headingClass}>{headline}</h3>
        {subheadline ? <p className={ledeClass}>{subheadline}</p> : null}

        <FormField label="Property Address" htmlFor="addr">
          <FormInput id="addr" type="text" placeholder="Street, neighbourhood, city" autoComplete="off" />
        </FormField>

        <FormRow stack={false}>
          <FormField label="Nº of Properties" labelId="nprop-label">
            <FormStepper
              aria-labelledby="nprop-label"
              data-stepper
              data-value={properties}
              data-min="1"
              value={properties}
              onChange={setProperties}
              min={1}
              id="nprop"
              name="nprop"
              decrementLabel="Decrease number of properties"
              incrementLabel="Increase number of properties"
            />
          </FormField>
          <FormField label="Nº of Bedrooms" htmlFor="nbed">
            <FormSelect id="nbed" options={BEDROOMS} chevron />
          </FormField>
        </FormRow>

        <FormButton data-wiz-next onClick={next} className="mt-[6px] w-full">
          {ctaLabel} →
        </FormButton>
        {note ? <FormNote>{note}</FormNote> : null}
      </div>

      <div data-panel="2" hidden={step !== 2}>
        <h3 className={headingClass}>Your contact details</h3>
        <p className={ledeClass}>Almost there — tell us how to reach you with the study.</p>

        <FormField label="Full Name" htmlFor="fname">
          <FormInput id="fname" type="text" placeholder="Jane Doe" autoComplete="name" />
        </FormField>
        <FormField label="Email" htmlFor="femail">
          <FormInput id="femail" type="email" placeholder="jane@example.com" autoComplete="email" />
        </FormField>
        <FormField label="Phone" htmlFor="fphone">
          <div className="flex gap-[10px]">
            <div className="w-[124px] flex-none">
              <FormSelect id="fphone-code" aria-label="Country code" defaultValue="+351" options={PHONE_CODES} chevron />
            </div>
            <FormInput id="fphone" type="tel" placeholder="912 345 678" autoComplete="tel" className="min-w-0 flex-1" />
          </div>
        </FormField>

        <FormCheckbox>
          I agree to the{" "}
          <a href="#" className={linkClass}>
            Terms &amp; Conditions
          </a>
          .
        </FormCheckbox>
        <FormCheckbox>
          I agree to the{" "}
          <a href="#" className={linkClass}>
            Privacy Policy
          </a>{" "}
          and consent to being contacted.
        </FormCheckbox>

        <div className="mt-[6px] flex items-center gap-[14px]">
          <button
            type="button"
            data-wiz-back
            onClick={back}
            className="flex-none cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-ink-soft transition-colors hover:text-accent-deep focus-visible:text-accent-deep focus-visible:underline focus-visible:outline-none"
          >
            ← Back
          </button>
          <FormButton data-wiz-next onClick={next}>
            Submit request →
          </FormButton>
        </div>
      </div>

      <div data-panel="3" hidden={step !== 3}>
        <div className="pt-[18px] pb-1.5 text-center">
          <svg
            aria-hidden
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
          <h3 className="mb-2.5 text-[26px] leading-[1.5]">Request received</h3>
          <p className="text-[14.5px] leading-[1.6] text-ink-soft">
            Thank you — our team will review your property and get back to you within 48 hours with your
            free profitability study.
          </p>
        </div>
      </div>
    </FormCard>
  );
}
