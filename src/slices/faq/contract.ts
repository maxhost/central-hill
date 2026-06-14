/**
 * Public contract of slice `faq` (the ONLY surface other slices may import).
 * Produces grouped marketing-page FAQ read models + cache tag
 * (docs/vertical-slices.md → S8). Distinct from per-building `building_faq` (owned
 * by `buildings`). Has no public routes of its own — S9 pages embed a group by key.
 * Consumers: S9 pages (Owners/Guests/Real-Estate FAQ sections), S14 translation.
 */

/** Entity types used for translation keys and cache tags. */
export const FAQ_GROUP = "faq_group" as const;
export const FAQ_ITEM = "faq_item" as const;

/** Cache tags this slice owns (conventions.md → Cache tags). */
export const FAQ_TAGS = {
  list: "faq-list",
} as const;

export interface FaqItem {
  id: string;
  /** Resolved [T] question (approved target locale, else source `en`). */
  question: string;
  /** Resolved [T] answer. */
  answer: string;
}

export interface FaqGroup {
  id: string;
  /** Language-neutral key binding the set to a page (owners|real_estate|guest|…). */
  key: string;
  items: FaqItem[];
}

export { getFaqGroup } from "./server/queries";

/**
 * Backoffice contribution (S12). `faqAdminScreens` is spread into `composeAdminNav`
 * by the admin panel layout; the group list + editor (with inline items) mount under
 * `app/(admin)/admin/(panel)/faq/…`. Pure data — safe to import anywhere.
 */
export { faqAdminScreens } from "./admin/screens";
