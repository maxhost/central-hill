"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ConsentCheckbox,
  FormStatus,
  Honeypot,
  NumberField,
  SubmitButton,
  TextField,
  useLeadForm,
} from "./components/fields";
import type { LeadFormProps } from "./types";

/**
 * Owner earnings-estimate request → `lead.kind = "earnings_estimate"`
 * (property_address, num_properties, num_bedrooms). Embedded by the Owners page
 * lead CTA (S9). Numbers are sent as integers; blanks surface as field errors
 * from the server validator.
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
    <form
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
      <div className="grid gap-5">
        <TextField name="property_address" label={t("fields.property_address")} value={address} onChange={setAddress} required error={fieldErrors.property_address} />
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField name="num_properties" label={t("fields.num_properties")} value={numProperties} onChange={setNumProperties} required error={fieldErrors.num_properties} />
          <NumberField name="num_bedrooms" label={t("fields.num_bedrooms")} value={numBedrooms} onChange={setNumBedrooms} required error={fieldErrors.num_bedrooms} />
        </div>
        <ConsentCheckbox checked={consent} onChange={setConsent} label={t("consent.notice")} error={fieldErrors.consent_text} />
        <Honeypot value={hp} onChange={setHp} />
        {status === "error" ? <FormStatus kind="error" message={t("error")} /> : null}
        <div>
          <SubmitButton pending={pending} label={t("earnings.submit")} pendingLabel={t("submitting")} />
        </div>
      </div>
    </form>
  );
}
