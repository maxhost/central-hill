import "server-only";
import { resolveOwnerMediaAlt } from "@core/media/owner-alt";
import { unstable_cache } from "next/cache";
import { asc } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { loadContent, loadTranslationRows } from "@core/i18n/content";
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import {
  COMPANY_SETTINGS,
  SETTINGS_TAGS,
  type CompanyStat,
  type NavLink,
  type NavLocation,
  type SiteGlobals,
  type StatKey,
} from "../contract";
import { company_settings } from "../schema";
import { SITE_ICON_KEYS } from "../site-icons";
import { resolveSiteIcons } from "./site-icons";
import { resolveWebsiteUrl } from "./website-locales";
import { resolveNavigationCtas } from "./navigation-ctas";
import { getFixedNav } from "./fixed-navigation";
import { resolveHoursLabel } from "./hours-labels";

/**
 * Public read functions for slice `settings` / `globals` (conventions.md → reads go
 * through typed, cache-tagged `server/` functions; never the DB at request time).
 * Both are wrapped in `unstable_cache` keyed by locale and tagged `globals` / `nav`
 * so a settings publish busts them (see `./publish`). Retired stat fields remain
 * readable for compatibility. Active hours labels use inline EN and approved
 * manual targets, then localized defaults (ADR0075).
 * Navigation resolves the fixed multilingual code tree (ADR0074), never legacy DB rows.
 */

const STAT_KEYS: StatKey[] = [
  "bookings",
  "years",
  "guests",
  "revenue",
  "buildings",
  "apartments",
];

const OG_W = 1200;
const OG_H = 630;

function toImageData(asset: MediaAsset | undefined, alt: string): MediaImageData | null {
  if (!asset) return null;
  return {
    url: mediaUrl(asset.r2_key),
    width: asset.width ?? OG_W,
    height: asset.height ?? OG_H,
    alt,
    blurhash: asset.blurhash,
  };
}

// ── Globals (singleton) ────────────────────────────────────────────────────────
async function _getGlobals(locale: Locale): Promise<SiteGlobals | null> {
  const rows = await db
    .select()
    .from(company_settings)
    .orderBy(asc(company_settings.created_at))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const ogId = row.default_og_image_media_id;
  const [content, media, manualRows] = await Promise.all([
    loadContent([{ type: COMPANY_SETTINGS, id: row.id }], locale),
    ogId ? loadMedia([ogId]) : Promise.resolve(new Map<string, MediaAsset>()),
    loadTranslationRows({ type: COMPANY_SETTINGS, id: row.id }),
  ]);

  const stats = {} as Record<StatKey, CompanyStat>;
  for (const key of STAT_KEYS) {
    const raw = row.stats[key];
    stats[key] = {
      value: raw?.value ?? "",
      label: content.get(COMPANY_SETTINGS, row.id, `stats.${key}.label`) ?? raw?.label ?? "",
    };
  }

  const og = ogId
    ? toImageData(media.get(ogId), resolveOwnerMediaAlt(manualRows, ogId, locale, content.get("media_asset", ogId, "alt") ?? "Central Hill"))
    : null;

  return {
    navigationCtas: resolveNavigationCtas(locale, manualRows),
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp ?? null,
    ownersPhone: row.owners_phone?.trim() || null,
    checkinPhone: row.checkin_phone?.trim() || null,
    website: resolveWebsiteUrl(row.website_url, locale, manualRows),
    social: row.social,
    stats,
    officeAddress: row.office_address,
    officeHours: row.office_hours ?? null,
    officeHoursLabel: resolveHoursLabel(row.office_hours_label, locale, manualRows),
    currency: row.currency,
    defaultOgImage: og,
    avantio: { accountId: row.avantio_account_id, widgetConfig: row.avantio_widget_config },
    showBuildingLocation: row.show_building_location,
    showBuildingCount: row.show_building_count,
    icons: resolveSiteIcons(row.site_icons),
  };
}

// The site icon key list is part of the cache key: adding a site icon must not serve an entry
// cached before the key existed (its `icons` would lack it).
const SITE_ICONS_SHAPE = SITE_ICON_KEYS.join(",");
// Same reason for the read-model shape: bump it when `SiteGlobals` gains a field, so an entry
// cached before manually localized office-hours labels is not served (v6, ADR0075).
const GLOBALS_SHAPE = "v7-image-alt";

export function getGlobals(locale: Locale): Promise<SiteGlobals | null> {
  return unstable_cache(() => _getGlobals(locale), ["settings:getGlobals", locale, GLOBALS_SHAPE, SITE_ICONS_SHAPE], {
    tags: [SETTINGS_TAGS.globals],
  })();
}

// ── Fixed navigation (header / footer trees, ADR0074) ──────────────────────────
export function getNav(locale: Locale, location: NavLocation): Promise<NavLink[]> {
  return unstable_cache(async () => getFixedNav(locale, location), ["settings:getNav", "fixed-v1", locale, location], {
    tags: [SETTINGS_TAGS.nav],
  })();
}
