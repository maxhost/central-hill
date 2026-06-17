"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ConsentCheckbox,
  FormStatus,
  Honeypot,
  NumberField,
  SubmitButton,
  TextAreaField,
  TextField,
  useLeadForm,
} from "./components/fields";
import type { LeadFormProps } from "./types";

/**
 * Real-estate / institutional deal enquiry → `lead.kind = "deal_enquiry"`. Embedded
 * by the Real Estate page (S9).
 *
 * Client feedback B7: keep the form simple and unintimidating. Only the main contact
 * fields (name + email) are always visible and required; "Asset details" and
 * "Additional information" are collapsed by default (native `<details>` disclosures)
 * and fully optional, so a visitor can submit with just their contact info.
 */
export function DealEnquiryForm({ source, className }: LeadFormProps) {
  const t = useTranslations("leads");
  const { pending, status, fieldErrors, submit } = useLeadForm(source);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [country, setCountry] = useState("");
  const [assetType, setAssetType] = useState("");
  const [unitsCount, setUnitsCount] = useState("");
  const [locations, setLocations] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");

  if (status === "ok") return <FormStatus kind="ok" message={t("deal.success")} />;

  const orUndef = (v: string) => (v.trim() === "" ? undefined : v.trim());

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          {
            kind: "deal_enquiry",
            fields: {
              contact_name: contactName,
              email,
              phone: orUndef(phone),
              company_name: orUndef(companyName),
              contact_title: orUndef(contactTitle),
              country: orUndef(country),
              asset_type: orUndef(assetType),
              units_count: unitsCount ? Number(unitsCount) : undefined,
              locations: orUndef(locations),
              notes: orUndef(notes),
            },
            marketing_consent: consent,
            consent_text: t("consent.notice"),
          },
          hp,
        );
      }}
    >
      <div className="grid gap-5">
        {/* Main contact — always visible, the only required fields. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="contact_name" label={t("fields.contact_name")} value={contactName} onChange={setContactName} required autoComplete="name" error={fieldErrors.contact_name} />
          <TextField name="email" type="email" label={t("fields.email")} value={email} onChange={setEmail} required autoComplete="email" error={fieldErrors.email} />
          <TextField name="phone" type="tel" label={t("fields.phone")} value={phone} onChange={setPhone} autoComplete="tel" error={fieldErrors.phone} />
        </div>

        <Disclosure label={t("deal.assetDetails")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="asset_type" label={t("fields.asset_type")} value={assetType} onChange={setAssetType} error={fieldErrors.asset_type} />
            <NumberField name="units_count" label={t("fields.units_count")} value={unitsCount} onChange={setUnitsCount} error={fieldErrors.units_count} />
            <TextField name="country" label={t("fields.country")} value={country} onChange={setCountry} autoComplete="country-name" error={fieldErrors.country} />
            <TextField name="locations" label={t("fields.locations")} value={locations} onChange={setLocations} error={fieldErrors.locations} />
          </div>
        </Disclosure>

        <Disclosure label={t("deal.additionalInfo")}>
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="company_name" label={t("fields.company_name")} value={companyName} onChange={setCompanyName} autoComplete="organization" error={fieldErrors.company_name} />
              <TextField name="contact_title" label={t("fields.contact_title")} value={contactTitle} onChange={setContactTitle} autoComplete="organization-title" error={fieldErrors.contact_title} />
            </div>
            <TextAreaField name="notes" label={t("fields.notes")} value={notes} onChange={setNotes} error={fieldErrors.notes} />
          </div>
        </Disclosure>

        <ConsentCheckbox checked={consent} onChange={setConsent} label={t("consent.notice")} error={fieldErrors.consent_text} />
        <Honeypot value={hp} onChange={setHp} />
        {status === "error" ? <FormStatus kind="error" message={t("error")} /> : null}
        <div>
          <SubmitButton pending={pending} label={t("deal.submit")} pendingLabel={t("submitting")} />
        </div>
      </div>
    </form>
  );
}

/** A collapsed-by-default optional section (native `<details>`, no JS). */
function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        {label}
        <span aria-hidden className="text-ink-soft transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="border-t border-line px-4 py-4">{children}</div>
    </details>
  );
}
