"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicFormModel } from "../public-types";
import { submitHeaderContactForm } from "../server/public-actions";
import { FormRuntime } from "./form-runtime";

/** Only the server-selected public model enters this island; recipient stays server-side. */
export function PublicContactForm({ model }: { model: PublicFormModel }) {
  const t = useTranslations("forms");
  const key = useRef("");
  const [honeypot, setHoneypot] = useState("");
  return <div className="mt-6" data-public-contact-form={model.id}>
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>{t("publicLeaveEmpty")}<input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={event => setHoneypot(event.target.value)} /></label>
    </div>
    <FormRuntime definition={model.definition} publicMode showHeading={false} onReset={() => { key.current = ""; setHoneypot(""); }} onSubmit={async (values, uploads) => {
      key.current ||= crypto.randomUUID();
      return submitHeaderContactForm({ id: model.id, expectedRevision: model.revision, locale: model.locale, fingerprint: model.fingerprint, submissionKey: key.current, values, honeypot }, uploads);
    }} />
  </div>;
}
