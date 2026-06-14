/**
 * Admin **save** schemas for slice `settings` (S12) — the company-globals singleton
 * and the navigation builder. Mirrors the public `companySettingsInput`/`navItemInput`
 * in the editor's post shape: optional fields are `nullable` (the client posts `null`
 * for empty controls), and [T] labels (stat labels, office-hours label, nav labels)
 * carry `min(1)` where required. `avantio_widget_config` arrives as a parsed object.
 */
import { z } from "zod";
import { tStr } from "@core/validation/primitives";

const socialUrl = z.url().nullable();

const statForm = z.object({
  value: z.string().max(40),
  label: tStr({ min: 1, max: 80 }),
});

export const companySettingsSaveInput = z.object({
  email: z.email(),
  phone: z.string().min(3).max(40),
  whatsapp: z.string().max(40).nullable(),
  social: z.object({
    instagram: socialUrl,
    facebook: socialUrl,
    linkedin: socialUrl,
    youtube: socialUrl,
    tiktok: socialUrl,
  }),
  stats: z.object({
    bookings: statForm,
    years: statForm,
    guests: statForm,
    revenue: statForm,
    buildings: statForm,
    apartments: statForm,
  }),
  office_address: z.string().min(1).max(300),
  office_hours: z.string().max(200).nullable(),
  office_hours_label: tStr({ max: 120 }).nullable(),
  currency: z.literal("EUR"),
  default_og_image_media_id: z.uuid().nullable(),
  avantio_account_id: z.string().min(1).max(120),
  avantio_widget_config: z.record(z.string(), z.unknown()),
});
export type CompanySettingsSaveInput = z.infer<typeof companySettingsSaveInput>;

/** A navigation link as the editor posts it; `id` present ⇒ update, absent ⇒ insert. */
const navLink = z.object({
  id: z.uuid().optional(),
  url: z.string().min(1).max(300),
  label: tStr({ min: 1, max: 80 }),
});

/** A top-level navigation item with one level of children (sub-nav / footer column). */
const navParent = navLink.extend({ children: z.array(navLink) });

export const navigationSaveInput = z.object({
  header: z.array(navParent),
  footer: z.array(navParent),
});
export type NavigationSaveInput = z.infer<typeof navigationSaveInput>;
