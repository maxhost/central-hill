"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  UiIcon,
} from "@core/ui";
import { orMessage } from "../or-message";

/**
 * The Owners-hero "earnings estimate" card — a 3-step wizard (1: property, 2: contact details,
 * 3: "Request received"), built on `core/ui`'s `form-card.tsx` primitives and styled like them
 * (the same field/label/control/button/focus look as Real Estate's `#deal-enquiry` form — a
 * deliberate, user-approved style unification; it used to carry its own `h-11`-input design).
 *
 * Structure and behaviour are unchanged from the pre-unification version: same steps,
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
 * exported via `pages/contract.ts` since that's a different slice (golden rule 2).
 *
 * Copy (spec owners-admin-editor S3):
 * - Step 1's `badge`/`headline`/`subheadline`/`ctaLabel`/`note` come from the caller (the
 *   only part that ever differed between the two hosts); "→" is appended to `ctaLabel` here.
 * - Steps 2–3's headings, intro, buttons and confirmation text are optional props
 *   (`contactTitle`/`contactLede`/`submitLabel`/`backLabel`/`doneTitle`/`doneBody` — Owners
 *   passes its `earnings_form.contact_step` / `done_step` fields). Blank / absent → the
 *   `pages.estimateForm.*` message of the visitor's locale (`orMessage`). The "→" / "←" arrows
 *   are added here, never part of the text. Buildings passes none, so it shows the i18n copy.
 * - Everything else — field labels, placeholders, the "Studio" option, the phone-code and
 *   stepper aria-labels, the two consent sentences (links via `t.rich`) — is fixed, not
 *   editable, and translated in `pages.estimateForm.*` (EN is the original markup's text).
 *   Read client-side with `useTranslations`: the locale layout's `NextIntlClientProvider` has
 *   no `messages` prop, so next-intl v4 forwards the request's full message catalog.
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

/** Bedroom options after the translated "Studio" (numbers aren't translated). */
const BEDROOM_COUNTS = ["1", "2", "3", "4", "5", "6+"];

const headingClass = "mb-2 text-[26px] leading-[1.5]";
const ledeClass = "mb-[22px] text-sm text-ink-soft";
const linkClass = "text-ink underline underline-offset-2";

export function OwnerEstimateForm({
  badge,
  headline,
  subheadline,
  ctaLabel,
  note,
  contactTitle,
  contactLede,
  submitLabel,
  backLabel,
  doneTitle,
  doneBody,
}: {
  badge?: string;
  headline: string;
  subheadline?: string;
  ctaLabel: string;
  note?: string;
  /** Step 2 heading. Blank / absent → `pages.estimateForm.contactTitle`. */
  contactTitle?: string;
  /** Step 2 intro line. Blank / absent → `pages.estimateForm.contactLede`. */
  contactLede?: string;
  /** Step 2 submit button text, without the arrow ("→" is appended). Blank → `…submit`. */
  submitLabel?: string;
  /** Step 2 back link text, without the arrow ("←" is prefixed). Blank → `…back`. */
  backLabel?: string;
  /** Step 3 heading. Blank / absent → `pages.estimateForm.doneTitle`. */
  doneTitle?: string;
  /** Step 3 text. Blank / absent → `pages.estimateForm.doneBody`. */
  doneBody?: string;
}) {
  const t = useTranslations("pages.estimateForm");
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
            <UiIcon name="star" size="1em" className="[&_path]:fill-current" />
            {badge}
          </span>
        ) : null}
        <h3 className={headingClass}>{headline}</h3>
        {subheadline ? <p className={ledeClass}>{subheadline}</p> : null}

        <FormField label={t("addressLabel")} htmlFor="addr">
          <FormInput id="addr" type="text" placeholder={t("addressPlaceholder")} autoComplete="off" />
        </FormField>

        <FormRow stack={false}>
          <FormField label={t("propertiesLabel")} labelId="nprop-label">
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
              decrementLabel={t("decreaseProperties")}
              incrementLabel={t("increaseProperties")}
            />
          </FormField>
          <FormField label={t("bedroomsLabel")} htmlFor="nbed">
            <FormSelect id="nbed" options={[t("studio"), ...BEDROOM_COUNTS]} chevron />
          </FormField>
        </FormRow>

        <FormButton data-wiz-next onClick={next} className="mt-[6px] w-full">
          {ctaLabel} →
        </FormButton>
        {note ? <FormNote>{note}</FormNote> : null}
      </div>

      <div data-panel="2" hidden={step !== 2}>
        <h3 className={headingClass}>{orMessage(contactTitle, t("contactTitle"))}</h3>
        <p className={ledeClass}>{orMessage(contactLede, t("contactLede"))}</p>

        <FormField label={t("nameLabel")} htmlFor="fname">
          <FormInput id="fname" type="text" placeholder={t("namePlaceholder")} autoComplete="name" />
        </FormField>
        <FormField label={t("emailLabel")} htmlFor="femail">
          <FormInput id="femail" type="email" placeholder={t("emailPlaceholder")} autoComplete="email" />
        </FormField>
        <FormField label={t("phoneLabel")} htmlFor="fphone">
          <div className="flex gap-[10px]">
            <div className="w-[124px] flex-none">
              <FormSelect id="fphone-code" aria-label={t("phoneCodeLabel")} defaultValue="+351" options={PHONE_CODES} chevron />
            </div>
            <FormInput id="fphone" type="tel" placeholder={t("phonePlaceholder")} autoComplete="tel" className="min-w-0 flex-1" />
          </div>
        </FormField>

        <FormCheckbox>
          {t.rich("agreeTerms", {
            terms: (chunks) => (
              <a href="#" className={linkClass}>
                {chunks}
              </a>
            ),
          })}
        </FormCheckbox>
        <FormCheckbox>
          {t.rich("agreePrivacy", {
            privacy: (chunks) => (
              <a href="#" className={linkClass}>
                {chunks}
              </a>
            ),
          })}
        </FormCheckbox>

        <div className="mt-[6px] flex items-center gap-[14px]">
          <button
            type="button"
            data-wiz-back
            onClick={back}
            className="flex-none cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-ink-soft transition-colors hover:text-accent-deep focus-visible:text-accent-deep focus-visible:underline focus-visible:outline-none"
          >
            {`← ${orMessage(backLabel, t("back"))}`}
          </button>
          <FormButton data-wiz-next onClick={next}>
            {`${orMessage(submitLabel, t("submit"))} →`}
          </FormButton>
        </div>
      </div>

      <div data-panel="3" hidden={step !== 3}>
        <div className="pt-[18px] pb-1.5 text-center">
          <UiIcon
            name="check"
            size={46}
            strokeWidth={1.8}
            className="mb-[18px] inline-block rounded-full border border-line p-3 text-accent"
          />
          <h3 className="mb-2.5 text-[26px] leading-[1.5]">{orMessage(doneTitle, t("doneTitle"))}</h3>
          <p className="text-[14.5px] leading-[1.6] text-ink-soft">{orMessage(doneBody, t("doneBody"))}</p>
        </div>
      </div>
    </FormCard>
  );
}
