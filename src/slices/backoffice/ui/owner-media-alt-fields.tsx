"use client";
import { useId } from "react";
import { useTranslations } from "next-intl";
import { OWNER_ALT_LOCALES, rawOwnerMediaAlts, type OwnerMediaAlts } from "@core/media/owner-alt";
import { Field, TextInput } from "./form";

/** Non-tab forms keep their single Save, with four language descriptions per image. */
export function OwnerMediaAltFields({ mediaId, value, onChange, disabled }: {
  mediaId: string | null;
  value: OwnerMediaAlts | undefined;
  onChange: (value: OwnerMediaAlts) => void;
  disabled?: boolean;
}) {
  const prefix = useId();
  const t = useTranslations("backoffice");
  if (!mediaId) return null;
  const alts = value ?? rawOwnerMediaAlts([], null);
  return <div className="space-y-3">
    {OWNER_ALT_LOCALES.map(locale => <Field key={locale} label={`${t("media.altLabel")} · ${locale.toUpperCase()}`} htmlFor={`${prefix}-${locale}`}>
      <TextInput id={`${prefix}-${locale}`} maxLength={500} disabled={disabled} value={alts[locale]} onChange={event => onChange({ ...alts, [locale]: event.target.value })} />
    </Field>)}
    <p className="text-xs text-ink-soft">{t("media.altLocalesHint")}</p>
  </div>;
}
