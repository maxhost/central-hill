import { EMPTY_DETAIL } from "../detail";
import type { ServiceCopy } from "../copy";
import {
  MAX_SERVICE_CENTS,
  type ServicePresentation,
  type ServiceSectionKey,
} from "../presentation";
import { type DetailDraft, detailToDraft, draftToDetail } from "./detail-draft";
import type { ServiceEditData } from "./queries";
import type { ServiceContent } from "../editorial-types";

/** Exact decimal parsing: no floating-point multiplication, truncation or exponent notation. */
export function eurosToCents(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value)) throw new Error("invalidEuros");
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const cents = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > BigInt(MAX_SERVICE_CENTS)) throw new Error("invalidEuros");
  return Number(cents);
}
export function centsToEuros(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
export function setSectionChoice(
  presentation: ServicePresentation | null,
  key: ServiceSectionKey,
  choice: boolean | undefined,
): ServicePresentation | null {
  const next = {
    ...presentation,
    version: 1 as const,
    sections: { ...presentation?.sections },
  };
  if (choice === undefined) delete next.sections[key];
  else next.sections[key] = choice;
  if (!Object.keys(next.sections).length)
    delete (next as ServicePresentation).sections;
  return Object.keys(next).length === 1 ? null : next;
}
export function sectionCount(key: ServiceSectionKey, d: DetailDraft): number {
  switch (key) {
    case "included":
      return d.highlights.length;
    case "itinerary":
      return d.itinerary.length;
    case "options":
      return d.option_groups.reduce((n, g) => n + g.items.length, 0);
    case "pricing":
      return d.pricing?.rows.length ?? 0;
    case "extras":
      return d.extras.length;
    case "partners":
      return d.partners.length;
    case "good_to_know":
      return (
        Object.values(d.good_to_know).reduce((n, rows) => n + rows.length, 0) +
        d.notes.length
      );
  }
}
/** Restore one section only; preserve presentation, unrelated copy, general data and media. */
export function discardSection(
  state: FormState,
  saved: FormState,
  section: ServiceSectionKey,
): FormState {
  const keys: Record<ServiceSectionKey, (keyof DetailDraft)[]> = {
    included: ["highlights", "included_title"],
    itinerary: ["itinerary"],
    options: ["option_groups"],
    pricing: ["pricing"],
    extras: ["extras"],
    partners: ["partners"],
    good_to_know: ["good_to_know", "notes"],
  };
  const detail = { ...state.detail };
  for (const key of keys[section])
    Object.assign(detail, { [key]: structuredClone(saved.detail[key]) });
  const copyKeys: Partial<Record<ServiceSectionKey, (keyof ServiceCopy)[]>> = {
    included: ["includedEyebrow"],
    itinerary: ["itineraryEyebrow", "itineraryTitle"],
    options: ["optionsEyebrow", "optionsTitle"],
    pricing: ["ratesEyebrow", "ratesTitle"],
    partners: ["partnersEyebrow", "partnersTitle"],
    good_to_know: [
      "knowEyebrow",
      "knowTitle",
      "knowIncluded",
      "knowCancellation",
      "knowPractical",
    ],
  };
  const copy = { ...state.copy };
  for (const key of copyKeys[section] ?? []) {
    if (saved.copy[key] === undefined) delete copy[key];
    else copy[key] = saved.copy[key];
  }
  return { ...state, detail, copy };
}
/** Known server guard messages are localized at the boundary; unknown Zod messages remain truthful. */
export function guardMessageKey(path: string, message: string): string | null {
  if (message === "Add content before showing this section.")
    return "emptySection";
  if (message === "Enter a starting price.") return "priceRequired";
  if (message === "Enter an http(s) booking URL.") return "externalUrl";
  if (message === "Enter a booking button label.") return "externalLabel";
  if (path.startsWith("copy.")) return "copyInvalid";
  if (message.includes("image") || message.includes("media"))
    return "mediaError";
  return null;
}

export type Status = "draft" | "published" | "archived";
export type BookingType = "enquiry" | "external" | "none";

export const STATUSES: Status[] = ["draft", "published", "archived"];
export const BOOKING_TYPES: BookingType[] = ["none", "enquiry", "external"];

export interface FormState {
  slug: string;
  status: Status;
  position: string;
  category_id: string;
  cover_media_id: string;
  og_image_media_id: string;
  price_from: string;
  price_suffix: string;
  /** Human-facing score ("4.7"); converted to integer tenths on submit. */
  rating: string;
  booking_type: BookingType;
  cta_url: string;
  cta_label: string;
  duration_label: string;
  name: string;
  excerpt: string;
  body: string;
  meta_title: string;
  meta_description: string;
  /** Rich detail sections, as an editable draft (serialised by `draftToDetail`). */
  detail: DetailDraft;
  gallery: string[];
  presentation: ServicePresentation | null;
  copy: ServiceCopy;
}

export function initialState(
  data:
    | ServiceEditData
    | (ServiceContent & { slug?: string; status?: Status })
    | null,
  defaultCategoryId: string,
): FormState {
  return {
    slug: data?.slug ?? "",
    status: data?.status ?? "draft",
    position: String(data?.position ?? 0),
    category_id: data?.category_id ?? defaultCategoryId,
    cover_media_id: data?.cover_media_id ?? "",
    og_image_media_id: data?.og_image_media_id ?? "",
    price_from: data?.price_from != null ? centsToEuros(data.price_from) : "",
    price_suffix: data?.price_suffix ?? "",
    rating: data?.rating_tenths != null ? String(data.rating_tenths / 10) : "",
    booking_type: data?.booking_type ?? "none",
    cta_url: data?.cta_url ?? "",
    cta_label: data?.cta_label ?? "",
    duration_label: data?.duration_label ?? "",
    name: data?.name ?? "",
    excerpt: data?.excerpt ?? "",
    body: data?.body ?? "",
    meta_title: data?.meta_title ?? "",
    meta_description: data?.meta_description ?? "",
    detail: detailToDraft(data?.detail ?? EMPTY_DETAIL),
    gallery: [...(data?.gallery ?? [])],
    presentation: data?.presentation
      ? structuredClone(data.presentation)
      : null,
    copy: { ...data?.copy },
  };
}

/**
 * "4.7" → 47 integer tenths (the column's unit), clamped to 0–5 and rounded to one
 * decimal. Blank or unparseable → null ("not rated"), which hides the star chip.
 * Accepts a comma decimal separator, which PT/ES/FR keyboards produce by default.
 */
function ratingTenths(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(5, Math.max(0, n)) * 10);
}

export function buildPayload(s: FormState, id: string | undefined) {
  const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
  const intOr = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    id,
    slug: s.slug.trim(),
    status: s.status,
    position: intOr(s.position, 0),
    category_id: s.category_id,
    cover_media_id: s.cover_media_id || null,
    og_image_media_id: orNull(s.og_image_media_id),
    price_from: eurosToCents(s.price_from),
    price_suffix: orNull(s.price_suffix),
    rating_tenths: ratingTenths(s.rating),
    booking_type: s.booking_type,
    cta_url: orNull(s.cta_url),
    cta_label: orNull(s.cta_label),
    duration_label: orNull(s.duration_label),
    name: s.name.trim(),
    excerpt: s.excerpt.trim(),
    body: s.body.trim(),
    meta_title: orNull(s.meta_title),
    meta_description: orNull(s.meta_description),
    detail: draftToDetail(s.detail),
    gallery: s.gallery,
    presentation: s.presentation,
    copy: s.copy,
  };
}
