/**
 * Slice `leads` — form-capture validation (ADR 0014).
 *
 * One pipeline, four `kind`s. Public submissions are validated by a discriminated
 * union on `kind`; on persist the typed `fields` are flattened into `lead_field`
 * KV rows (documented keys per kind, data-model.md). GDPR consent is first-class:
 * the client sends `marketing_consent` + the verbatim `consent_text` shown; the
 * server stamps `consent_at`, `ip_address`, `user_agent`.
 * See docs/data-model.md → Slice leads.
 */
import { z } from "zod";
import { email, locale } from "@core/validation/primitives";

export const leadKind = z.enum(["earnings_estimate", "deal_enquiry", "contact", "newsletter"]);
export type LeadKind = z.infer<typeof leadKind>;

export const leadStatus = z.enum(["new", "in_progress", "closed"]);

// ── Per-kind field shapes (→ lead_field KV) ──────────────────────────────────
const earningsFields = z.object({
  property_address: z.string().min(1).max(300),
  num_properties: z.number().int().positive().max(1000),
  num_bedrooms: z.number().int().positive().max(100),
});

const dealEnquiryFields = z.object({
  // Main contact (always shown, the only required fields — client feedback B7).
  contact_name: z.string().min(1).max(160),
  email,
  phone: z.string().min(3).max(40).optional(),
  // Asset details + additional info are collapsed and optional in the form.
  company_name: z.string().max(200).optional(),
  contact_title: z.string().max(120).optional(),
  country: z.string().max(80).optional(),
  asset_type: z.string().max(120).optional(),
  units_count: z.number().int().positive().max(100000).optional(),
  locations: z.string().max(400).optional(),
  current_status: z.string().max(400).optional(),
  target_model: z.string().max(120).optional(),
  timeline: z.string().max(120).optional(),
  notes: z.string().max(4000).optional(),
});

const contactFields = z.object({
  name: z.string().min(1).max(160),
  email,
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
});

const newsletterFields = z.object({
  email,
});

// ── Consent (client-supplied portion) ────────────────────────────────────────
const consent = z.object({
  marketing_consent: z.boolean(),
  /** Verbatim snapshot of the consent notice shown at submit time. */
  consent_text: z.string().min(1).max(2000),
});

// ── Public submission (client → server action) ───────────────────────────────
const submissionBase = z.object({
  locale,
  source_page: z.string().min(1).max(200),
  ...consent.shape,
});

export const leadSubmission = z.discriminatedUnion("kind", [
  submissionBase.extend({ kind: z.literal("earnings_estimate"), fields: earningsFields }),
  submissionBase.extend({ kind: z.literal("deal_enquiry"), fields: dealEnquiryFields }),
  submissionBase.extend({ kind: z.literal("contact"), fields: contactFields }),
  submissionBase.extend({ kind: z.literal("newsletter"), fields: newsletterFields }),
]);
export type LeadSubmission = z.infer<typeof leadSubmission>;

/** Server-stamped consent proof, added on persist (never from the client). */
export const consentProof = z.object({
  consent_at: z.iso.datetime(),
  ip_address: z.union([z.ipv4(), z.ipv6()]),
  user_agent: z.string().max(500),
});
export type ConsentProof = z.infer<typeof consentProof>;
