import type { Locale } from "@core/db/columns";
export interface CapturedContactField {
  id: string; label: string; type: string; value: string | boolean | { kind: "file"; name: string; type: string; size: number };
  displayValue: string; consent: boolean;
}
export interface ContactFormSnapshot {
  formId: string; name: string; revision: number; locale: Locale; fingerprint: string;
  sourcePage?: "header-contact" | "about-contact"; assignmentIdentity?: string; payloadHash: string; fields: CapturedContactField[];
}
export interface ContactCaptureInput {
  sourcePage?: "header-contact" | "about-contact"; submissionKey: string; snapshot: ContactFormSnapshot;
  email: string | null; ipAddress: string | null; userAgent: string | null;
}
export type ContactCaptureResult =
  | { status: "created" | "duplicate"; leadId: string }
  | { status: "stale" | "conflict" };
