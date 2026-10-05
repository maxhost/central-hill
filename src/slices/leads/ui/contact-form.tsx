"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ConsentCheckbox,
  FormStatus,
  Honeypot,
  LeadFormShell,
  SubmitButton,
  TextAreaField,
  TextField,
  useLeadForm,
} from "./components/fields";
import type { LeadFormProps } from "./types";

/**
 * General contact form → `lead.kind = "contact"` (name, email, subject, message). Rendered
 * **bare** (no card chrome — `FormCard bare`): both hosts already draw the container (the
 * header's contact dialog panel, and the service page's enquiry card), so a second card inside
 * would double the frame. Fields/consent/submit use the `core/ui` form-card look.
 */
export function ContactForm({ source, className }: LeadFormProps) {
  const t = useTranslations("leads");
  const { pending, status, fieldErrors, submit } = useLeadForm(source);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");

  if (status === "ok") return <FormStatus kind="ok" message={t("contact.success")} />;

  return (
    <LeadFormShell
      bare
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          {
            kind: "contact",
            fields: { name, email, subject, message },
            marketing_consent: consent,
            consent_text: t("consent.notice"),
          },
          hp,
        );
      }}
    >
      <TextField name="name" label={t("fields.name")} value={name} onChange={setName} required autoComplete="name" error={fieldErrors.name} />
      <TextField name="email" type="email" label={t("fields.email")} value={email} onChange={setEmail} required autoComplete="email" error={fieldErrors.email} />
      <TextField name="subject" label={t("fields.subject")} value={subject} onChange={setSubject} required error={fieldErrors.subject} />
      <TextAreaField name="message" label={t("fields.message")} value={message} onChange={setMessage} required error={fieldErrors.message} />
      <ConsentCheckbox checked={consent} onChange={setConsent} label={t("consent.notice")} error={fieldErrors.consent_text} />
      <Honeypot value={hp} onChange={setHp} />
      {status === "error" ? <FormStatus kind="error" message={t("error")} className="mt-[16px] mb-[10px]" /> : null}
      <SubmitButton pending={pending} label={t("contact.submit")} pendingLabel={t("submitting")} />
    </LeadFormShell>
  );
}
