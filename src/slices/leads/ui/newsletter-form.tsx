"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConsentCheckbox, FormStatus, Honeypot, SubmitButton, TextField, useLeadForm } from "./components/fields";
import type { LeadFormProps } from "./types";

/**
 * Newsletter signup → `lead.kind = "newsletter"` (email only). The consent box is
 * the opt-in itself. Designed to back the blog `newsletter-signup` island (S5).
 */
export function NewsletterForm({ source, className }: LeadFormProps) {
  const t = useTranslations("leads");
  const { pending, status, fieldErrors, submit } = useLeadForm(source);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");

  if (status === "ok") return <FormStatus kind="ok" message={t("newsletter.success")} />;

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          {
            kind: "newsletter",
            fields: { email },
            marketing_consent: consent,
            consent_text: t("consent.newsletter"),
          },
          hp,
        );
      }}
    >
      <div className="grid gap-4">
        <TextField name="email" type="email" label={t("fields.email")} value={email} onChange={setEmail} required autoComplete="email" placeholder={t("newsletter.placeholder")} error={fieldErrors.email} />
        <ConsentCheckbox checked={consent} onChange={setConsent} label={t("consent.newsletter")} error={fieldErrors.consent_text} />
        <Honeypot value={hp} onChange={setHp} />
        {status === "error" ? <FormStatus kind="error" message={t("error")} /> : null}
        <div>
          <SubmitButton pending={pending} label={t("newsletter.submit")} pendingLabel={t("submitting")} />
        </div>
      </div>
    </form>
  );
}
