import type { Locale } from "@core/db/columns";

export type FormTemplate = "contact" | "newsletter" | "owner-estimate";
export type FieldType = "text" | "email" | "tel" | "textarea" | "number" | "select" | "checkbox";
export interface FormOption { id: string; label: string }
export interface FormStep { id: string; title: string }
export interface FormField {
  id: string; stepId: string; type: FieldType; label: string;
  placeholder: string; help: string; required: boolean; width: 1 | 2;
  options: FormOption[]; min?: number; max?: number;
  /** Consent answers retain their exact rendered label in the test snapshot. */
  consent: boolean;
}
export interface FormCopy {
  title: string; description: string; submit: string; next: string; back: string;
  cancel: string; successTitle: string; successMessage: string; errorMessage: string;
}
export interface FormBlueprint {
  schemaVersion: 1; columns: 1 | 2; steps: FormStep[]; fields: FormField[];
  copy: FormCopy; replyToFieldId: string | null;
}
export type TargetLocale = Exclude<Locale, "en">;
export interface FormRecord {
  id: string; name: string; template: FormTemplate; recipient: string;
  status: "draft" | "archived"; revision: number; definition: FormBlueprint;
  updatedAt: string;
}
export interface FormTranslation {
  value: string; state: "draft" | "needs_review" | "approved"; stale: boolean;
}
export type FormTranslations = Record<TargetLocale, Record<string, FormTranslation>>;
export interface FormEditorModel { form: FormRecord; translations: FormTranslations }
export type FormValues = Record<string, string | boolean>;
export type DeliveryState = "accepted" | "logged" | "skipped" | "failed";
export type FormResult<T> = { ok: true; data: T } | {
  ok: false; code: "validation" | "conflict" | "not_found" | "server";
  error: string; fieldErrors?: Record<string, string>;
};
export interface SaveFormInput {
  id: string; expectedRevision: number; name: string; recipient: string;
  definition: FormBlueprint;
}
export interface SaveFormLocaleInput {
  id: string; expectedRevision: number; locale: TargetLocale;
  values: Record<string, string>; approve: boolean;
}
export interface TestFormInput {
  id: string; expectedRevision: number; locale: Locale; values: FormValues;
}
