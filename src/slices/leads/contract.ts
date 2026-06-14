/**
 * Public contract of slice `leads` (the ONLY surface other slices may import).
 * Form capture for the four lead `kind`s — earnings estimate, deal enquiry,
 * contact, newsletter — sharing one pipeline (ADR 0011/0014): validate → persist
 * `lead` + `lead_field` KV → best-effort staff email (`core/email`) → backoffice
 * inbox (S12). Field values are user-entered, never [T] (not translated).
 *
 * Consumers: S9 pages (`lead-cta` → earnings/deal/contact forms), S5 blog
 * (`newsletter-signup` → newsletter form). The backoffice inbox/admin is S12.
 */

/** Entity type used for cache tags / backoffice keys. Leads are not public content. */
export const LEAD = "lead" as const;

export type { LeadKind, LeadSubmission } from "./validation";
export { leadKind, leadStatus } from "./validation";

export type { LeadActionResult } from "./types";

/** The public submit action (`"use server"`). See `server/actions.ts`. */
export { submitLead } from "./server/actions";

/**
 * Ready-to-embed form components (client islands). Each reads its own labels via
 * `useTranslations("leads")` and posts through `submitLead`; embedders pass only a
 * `source` (the page key recorded as `source_page`) and may override the heading.
 */
export { EarningsEstimateForm } from "./ui/earnings-estimate-form";
export { DealEnquiryForm } from "./ui/deal-enquiry-form";
export { ContactForm } from "./ui/contact-form";
export { NewsletterForm } from "./ui/newsletter-form";
export type { LeadFormProps } from "./ui/types";

/**
 * Backoffice contribution (S12). `leadsAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout to add the leads inbox to the
 * sidebar; the inbox/detail screens are mounted under `app/(admin)/admin/(panel)/
 * leads/…`. Pure data (no server/client runtime) — safe to import anywhere.
 */
export { leadsAdminScreens } from "./admin/screens";
