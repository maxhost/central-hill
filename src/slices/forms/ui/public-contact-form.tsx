"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicFormModel } from "../public-types";
import { submitHeaderContactForm, submitAboutContactForm } from "../server/public-actions";
import { FormRuntime } from "./form-runtime";

/** Only the server-selected public model enters this island; recipient stays server-side. */
export function PublicContactForm({ model, preview = false }: { model: PublicFormModel; preview?: boolean }) {
  const t = useTranslations("forms");
  const key = useRef("");
  const [honeypot, setHoneypot] = useState("");
  if (preview) return <div inert className="mt-6" data-public-contact-form={model.id} data-form-preview>
    <FormRuntime definition={model.definition} publicMode showHeading={false} onSubmit={async () => ({ ok: false })} />
  </div>;
  return <div className="mt-6" data-public-contact-form={model.id}>
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>{t("publicLeaveEmpty")}<input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={event => setHoneypot(event.target.value)} /></label>
    </div>
    <FormRuntime definition={model.definition} publicMode showHeading={false} onReset={() => { key.current = ""; setHoneypot(""); }} onSubmit={async (values, uploads) => {
      key.current ||= crypto.randomUUID();
      const submit = model.placement === "about-contact" ? submitAboutContactForm : submitHeaderContactForm;
      return submit({ id: model.id, expectedRevision: model.revision, locale: model.locale, fingerprint: model.fingerprint, ...(model.placement === "about-contact" ? { assignmentIdentity: model.assignmentIdentity } : {}), submissionKey: key.current, values, honeypot }, uploads);
    }} />
  </div>;
}
