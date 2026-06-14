/**
 * Slice `settings` / `globals` — input validation (company_settings singleton + nav_item).
 * Absorbs site-wide stats/contact/office/social + Avantio config + default OG image
 * (data-model.md). Stat *values* are figures; stat *labels* and the hours label are [T].
 * See docs/data-model.md → Slice settings / globals.
 */
import { z } from "zod";
import { email, mediaId, position, tStr, tStrOpt, url } from "@core/validation/primitives";

/** A headline company stat: figure + translatable label. */
const stat = z.object({
  value: z.string().min(1).max(40),
  label: tStr({ max: 80 }),
});

export const companySettingsInput = z.object({
  // contact
  email,
  phone: z.string().min(3).max(40),
  whatsapp: z.string().max(40).optional(),
  social: z
    .object({
      instagram: url.optional(),
      facebook: url.optional(),
      linkedin: url.optional(),
      youtube: url.optional(),
      tiktok: url.optional(),
    })
    .default({}),
  // company stats
  stats: z.object({
    bookings: stat,
    years: stat,
    guests: stat,
    revenue: stat,
    buildings: stat,
    apartments: stat,
  }),
  // office
  office_address: z.string().min(1).max(300),
  office_hours: z.string().max(200).optional(),
  office_hours_label: tStrOpt({ max: 120 }), // [T]
  // misc
  currency: z.literal("EUR").default("EUR"),
  default_og_image_media_id: mediaId.optional(),
  // Avantio
  avantio_account_id: z.string().min(1).max(120),
  avantio_widget_config: z.record(z.string(), z.unknown()).default({}),
});
export type CompanySettingsInput = z.infer<typeof companySettingsInput>;

export const navItemInput = z.object({
  location: z.enum(["header", "footer"]),
  parent_id: z.uuid().optional(),
  position,
  url: z.string().min(1).max(300), // internal path or absolute URL
  // [T]
  label: tStr({ max: 80 }),
});
export type NavItemInput = z.infer<typeof navItemInput>;
