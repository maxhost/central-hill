"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn, FormCard, FormCheckbox, FormField, FormInput, FormMessage, FormSubmit, FormToneScope } from "@core/ui";
import { BREVO_NEWSLETTER_ACTION, BREVO_NEWSLETTER_TIMEOUT_MS, subscribeBrevoNewsletter } from "./brevo-newsletter";

/** Brevo submission with the Blog's existing form-card primitives, copy and dark/light tone. */
export function BrevoNewsletterForm({ source, className, theme = "light", disabled = false }: {
  source: string;
  className?: string;
  theme?: "light" | "dark";
  disabled?: boolean;
}) {
  const t = useTranslations("leads");
  const response = useTranslations("settings.footer.newsletter");
  const locale = useLocale();
  const emailId = useId();
  const consentId = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const requestRef = useRef<AbortController | null>(null);
  const attemptRef = useRef(0);
  const pending = status === "pending";

  useEffect(() => () => {
    attemptRef.current++;
    requestRef.current?.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || requestRef.current || !consent || !event.currentTarget.reportValidity()) return;
    const attempt = ++attemptRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("pending");
    const timeout = window.setTimeout(() => controller.abort(), BREVO_NEWSLETTER_TIMEOUT_MS);
    const accepted = await subscribeBrevoNewsletter({ email, consent, locale, honeypot }, controller.signal);
    window.clearTimeout(timeout);
    if (attemptRef.current !== attempt) return;
    requestRef.current = null;
    setStatus(accepted ? "success" : "error");
  }

  if (status === "success") return (
    <FormToneScope tone={theme}>
      <FormMessage kind="ok">{response("success")}</FormMessage>
    </FormToneScope>
  );

  return (
    <FormCard bare tone={theme} className={cn("leading-[1.6]", className)}
      action={BREVO_NEWSLETTER_ACTION} method="POST" data-type="subscription" data-newsletter-source={source}
      onSubmit={submit} aria-busy={pending}>
      <FormField htmlFor={emailId} label={t("fields.email")} required>
        <FormInput id={emailId} name="EMAIL" type="email" required autoComplete="email"
          value={email} onChange={event => setEmail(event.target.value)}
          placeholder={t("newsletter.placeholder")} disabled={disabled || pending} />
      </FormField>
      <FormCheckbox id={consentId} name="OPT_IN" value="1" required
        checked={consent} onChange={event => setConsent(event.target.checked)} disabled={disabled || pending}>
        {t("consent.newsletter")}
      </FormCheckbox>
      <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="email_address_check" tabIndex={-1} autoComplete="off"
            value={honeypot} onChange={event => setHoneypot(event.target.value)} />
        </label>
      </div>
      <input type="hidden" name="locale" value={locale} />
      {status === "error" ? <FormMessage kind="error" className="mt-[16px] mb-[10px]">{response("error")}</FormMessage> : null}
      <FormSubmit disabled={disabled || pending}>{pending ? t("submitting") : t("newsletter.submit")}</FormSubmit>
    </FormCard>
  );
}
