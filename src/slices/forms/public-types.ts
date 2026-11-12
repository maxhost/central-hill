import type { Locale } from "@core/db/columns";
import type { FormBlueprint, FormInputValues } from "./types";

export const HEADER_CONTACT_LOCK = "header-contact:v1";
export const FORMS_PUBLIC_TAGS = { all: "forms:public", form: (id: string) => `form_definition:${id}` } as const;
export interface PublicFormModel { id: string; revision: number; locale: Locale; fingerprint: string; definition: FormBlueprint; placement?: "header-contact" | "about-contact" | "guests-dual-cta" | "real-estate-enquiry" | "service-enquiry"; assignmentIdentity?: string; serviceId?: string }
export interface HeaderFormOption { id: string; name: string; available: boolean; reason: "archived" | "recipient" | "definition" | null }
export interface PublicContactInput {
  id: string; expectedRevision: number; locale: Locale; fingerprint: string;
  assignmentIdentity?: string; serviceId?: string; submissionKey: string; values: FormInputValues; honeypot: string;
}
export type PublicContactResult = { ok: true } | {
  ok: false; code: "validation" | "stale" | "rate_limited" | "server";
  error?: string; fieldErrors?: Record<string, string>;
};
