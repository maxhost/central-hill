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
 * by the Real Estate page (S9). Several fields are optional (sent only when filled).
 */
export function DealEnquiryForm({ source, className }: LeadFormProps) {
  const t = useTranslations("leads");
  const { pending, status, fieldErrors, submit } = useLeadForm(source);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [assetType, setAssetType] = useState("");
  const [unitsCount, setUnitsCount] = useState("");
  const [locations, setLocations] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");

  if (status === "ok") return <FormStatus kind="ok" message={t("deal.success")} />;

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          {
            kind: "deal_enquiry",
            fields: {
              company_name: companyName,
              contact_name: contactName,
              contact_title: contactTitle || undefined,
              email,
              phone: phone || undefined,
              country,
              asset_type: assetType,
              units_count: unitsCount ? Number(unitsCount) : undefined,
              locations: locations || undefined,
              notes: notes || undefined,
            },
            marketing_consent: consent,
            consent_text: t("consent.notice"),
          },
          hp,
        );
      }}
    >
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="company_name" label={t("fields.company_name")} value={companyName} onChange={setCompanyName} required autoComplete="organization" error={fieldErrors.company_name} />
          <TextField name="country" label={t("fields.country")} value={country} onChange={setCountry} required autoComplete="country-name" error={fieldErrors.country} />
          <TextField name="contact_name" label={t("fields.contact_name")} value={contactName} onChange={setContactName} required autoComplete="name" error={fieldErrors.contact_name} />
          <TextField name="contact_title" label={t("fields.contact_title")} value={contactTitle} onChange={setContactTitle} autoComplete="organization-title" error={fieldErrors.contact_title} />
          <TextField name="email" type="email" label={t("fields.email")} value={email} onChange={setEmail} required autoComplete="email" error={fieldErrors.email} />
          <TextField name="phone" type="tel" label={t("fields.phone")} value={phone} onChange={setPhone} autoComplete="tel" error={fieldErrors.phone} />
          <TextField name="asset_type" label={t("fields.asset_type")} value={assetType} onChange={setAssetType} required error={fieldErrors.asset_type} />
          <NumberField name="units_count" label={t("fields.units_count")} value={unitsCount} onChange={setUnitsCount} error={fieldErrors.units_count} />
        </div>
        <TextField name="locations" label={t("fields.locations")} value={locations} onChange={setLocations} error={fieldErrors.locations} />
        <TextAreaField name="notes" label={t("fields.notes")} value={notes} onChange={setNotes} error={fieldErrors.notes} />
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
