"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { FormRow } from "@core/ui";
import {
  ConsentCheckbox,
  FormStatus,
  Honeypot,
  LeadFormShell,
  NumberField,
  SubmitButton,
  TextField,
  useLeadForm,
} from "./components/fields";
import type { LeadFormProps } from "./types";

/**
 * Owner earnings-estimate request → `lead.kind = "earnings_estimate"`
 * (property_address, num_properties, num_bedrooms). Built to back the Owners page lead CTA
 * (S9) — not mounted anywhere today (the live Owners hero is the pages slice's
 * `OwnerEstimateForm` wizard). Numbers are sent as integers; blanks surface as field errors
 * from the server validator. Rendered as a raised `core/ui` `FormCard`, like that wizard.
 */
export function EarningsEstimateForm({ source, className }: LeadFormProps) {
  const t = useTranslations("leads");
  const { pending, status, fieldErrors, submit } = useLeadForm(source);
  const [address, setAddress] = useState("");
  const [numProperties, setNumProperties] = useState("1");
  const [numBedrooms, setNumBedrooms] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");

  if (status === "ok") return <FormStatus kind="ok" message={t("earnings.success")} />;

  return (
    <LeadFormShell
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          {
            kind: "earnings_estimate",
            fields: {
              property_address: address,
              num_properties: Number(numProperties),
              num_bedrooms: Number(numBedrooms),
            },
            marketing_consent: consent,
            consent_text: t("consent.notice"),
          },
          hp,
        );
      }}
    >
      <TextField name="property_address" label={t("fields.property_address")} value={address} onChange={setAddress} required error={fieldErrors.property_address} />
      <FormRow>
        <NumberField name="num_properties" label={t("fields.num_properties")} value={numProperties} onChange={setNumProperties} required error={fieldErrors.num_properties} />
        <NumberField name="num_bedrooms" label={t("fields.num_bedrooms")} value={numBedrooms} onChange={setNumBedrooms} required error={fieldErrors.num_bedrooms} />
      </FormRow>
      <ConsentCheckbox checked={consent} onChange={setConsent} label={t("consent.notice")} error={fieldErrors.consent_text} />
      <Honeypot value={hp} onChange={setHp} />
      {status === "error" ? <FormStatus kind="error" message={t("error")} className="mt-[16px] mb-[10px]" /> : null}
      <SubmitButton pending={pending} label={t("earnings.submit")} pendingLabel={t("submitting")} />
    </LeadFormShell>
  );
}
