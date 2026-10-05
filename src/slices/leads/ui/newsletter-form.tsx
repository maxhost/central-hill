"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ConsentCheckbox,
  FormStatus,
  Honeypot,
  LeadFormShell,
  SubmitButton,
  TextField,
  useLeadForm,
} from "./components/fields";
import type { LeadFormProps } from "./types";

/**
 * Newsletter signup → `lead.kind = "newsletter"` (email only). The consent box is
 * the opt-in itself. Designed to back the blog `newsletter-signup` island (S5);
 * pass `theme="dark"` when embedding on a dark band — it maps to the `core/ui` form-card
 * `tone="dark"` (on-feature colours), including the success message that replaces the form.
 * Rendered **bare** (no card chrome): the host band is the container.
 */
export function NewsletterForm({ source, className, theme = "light" }: LeadFormProps & { theme?: "light" | "dark" }) {
  const t = useTranslations("leads");
  const { pending, status, fieldErrors, submit } = useLeadForm(source);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");

  if (status === "ok") return <FormStatus kind="ok" tone={theme} message={t("newsletter.success")} />;

  return (
    <LeadFormShell
      bare
      tone={theme}
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
      <TextField name="email" type="email" label={t("fields.email")} value={email} onChange={setEmail} required autoComplete="email" placeholder={t("newsletter.placeholder")} error={fieldErrors.email} />
      <ConsentCheckbox checked={consent} onChange={setConsent} label={t("consent.newsletter")} error={fieldErrors.consent_text} />
      <Honeypot value={hp} onChange={setHp} />
      {status === "error" ? <FormStatus kind="error" message={t("error")} className="mt-[16px] mb-[10px]" /> : null}
      <SubmitButton pending={pending} label={t("newsletter.submit")} pendingLabel={t("submitting")} />
    </LeadFormShell>
  );
}
