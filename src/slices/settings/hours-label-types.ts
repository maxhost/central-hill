export const HOURS_LABEL_LOCALES = ["en", "es", "pt", "fr"] as const;
export const HOURS_LABEL_TARGET_LOCALES = ["es", "pt", "fr"] as const;
export type HoursLabelTranslations = Record<(typeof HOURS_LABEL_TARGET_LOCALES)[number], string>;
export const HOURS_LABEL_MAX = 120;
export const OFFICE_HOURS_DEFAULT_LABELS = {
  en: "Office Hours", es: "Horario de atención", pt: "Horário de atendimento", fr: "Horaires d’ouverture",
} as const;
/** Used only when the shared authored schedule is blank; authored text is never rewritten. */
export const OFFICE_HOURS_DEFAULT_VALUES = {
  en: "Monday – Friday · 09:30 – 18:00",
  es: "Lunes – Viernes · 09:30 – 18:00",
  pt: "Segunda – Sexta · 09:30 – 18:00",
  fr: "Lundi – Vendredi · 09:30 – 18:00",
} as const;
