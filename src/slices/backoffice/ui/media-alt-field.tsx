"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { MediaAlts } from "@core/media/alt";
import { Field, TextInput } from "./form";

interface MediaAltContextValue {
  locale: string;
  value: MediaAlts | undefined;
  onChange: (value: MediaAlts) => void;
  disabled?: boolean;
}
const Context = createContext<MediaAltContextValue | null>(null);

/** One localized document owns its descriptions; nested pickers share this binding. */
export function MediaAltProvider({ children, ...value }: MediaAltContextValue & { children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function MediaAltField({ mediaId }: { mediaId: string | null }) {
  const context = useContext(Context);
  const id = useId();
  const t = useTranslations("backoffice");
  if (!context || !mediaId) return null;
  return <Field label={`${t("media.altLabel")} · ${context.locale.toUpperCase()}`} htmlFor={id} hint={t("media.altHint")}>
    <TextInput id={id} maxLength={500} value={context.value?.[mediaId] ?? ""} disabled={context.disabled}
      onChange={event => context.onChange({ ...context.value, [mediaId]: event.target.value })} />
  </Field>;
}
