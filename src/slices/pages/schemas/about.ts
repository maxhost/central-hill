/**
 * `about` page content schema (ADR 0012). Source-locale values only.
 * Composed at render time: stats band + office block → company_settings.
 * Team/departments, partners, certifications, "founded 2012" are STATIC copy
 * here — not entities (confirmed against the brief).
 * The contact form fields are fixed in code → lead.kind='contact'.
 * See docs/data-model.md → Page content model → about.
 */
import { z } from "zod";
import { cta, iconKey, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { faqGroupKey, fixed, iconCard, titledItem } from "./_shared";

/** An org department/team unit (uses `name`, not `title`). */
const department = z.object({
  icon_key: iconKey,
  name: tStr({ max: 120 }),
  description: tStr({ max: 400 }),
});

/** A certification/accreditation (issuer is a proper noun → not translated). */
const certification = z.object({
  icon_key: iconKey,
  title: tStr({ max: 120 }),
  issuer: z.string().min(1).max(120),
  description: tStr({ max: 400 }),
});

export const aboutSchema = z.object({
  hero: z.object({
    image_media_id: mediaId,
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    mission: tStr({ max: 600 }),
  }),
  story: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    narrative: fixed(tStr({ max: 1200 }), 3),
  }),
  serve: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    audiences: fixed(iconCard, 3),
  }),
  values: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(titledItem, 4),
  }),
  organisation: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    departments: fixed(department, 6),
  }),
  certifications: z.object({
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(certification, 3),
  }),
  community: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    copy: fixed(tStr({ max: 1200 }), 2),
    image_media_id: mediaId,
  }),
  contact: z.object({
    headline: tStr({ max: 160 }),
    cta_guests: cta,
    cta_owners: cta,
    cta_partners: cta,
    form: z.object({
      headline: tStr({ max: 160 }),
      subheadline: tStrOpt({ max: 280 }),
    }),
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type AboutContent = z.infer<typeof aboutSchema>;
