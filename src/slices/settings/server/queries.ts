import "server-only";
import { unstable_cache } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import { loadContent } from "@core/i18n/content";
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import {
  COMPANY_SETTINGS,
  NAV_ITEM,
  SETTINGS_TAGS,
  type CompanyStat,
  type NavLink,
  type NavLocation,
  type SiteGlobals,
  type StatKey,
} from "../contract";
import { company_settings, nav_item } from "../schema";

/**
 * Public read functions for slice `settings` / `globals` (conventions.md → reads go
 * through typed, cache-tagged `server/` functions; never the DB at request time).
 * Both are wrapped in `unstable_cache` keyed by locale and tagged `globals` / `nav`
 * so a settings publish busts them (see `./publish`). Translatable fields (stat
 * labels, office-hours label, nav labels) resolve via `core/i18n` with the
 * source-locale (`en`) fallback + `approved`-only gating for target locales.
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
  const [content, media] = await Promise.all([
    loadContent([{ type: COMPANY_SETTINGS, id: row.id }], locale),
    ogId ? loadMedia([ogId]) : Promise.resolve(new Map<string, MediaAsset>()),
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
    ? toImageData(media.get(ogId), content.get("media_asset", ogId, "alt") ?? "Central Hill")
    : null;

  return {
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp ?? null,
    social: row.social,
    stats,
    officeAddress: row.office_address,
    officeHours: row.office_hours ?? null,
    officeHoursLabel:
      content.get(COMPANY_SETTINGS, row.id, "office_hours_label") ?? row.office_hours_label ?? null,
    currency: row.currency,
    defaultOgImage: og,
    avantio: { accountId: row.avantio_account_id, widgetConfig: row.avantio_widget_config },
  };
}

export function getGlobals(locale: Locale): Promise<SiteGlobals | null> {
  return unstable_cache(() => _getGlobals(locale), ["settings:getGlobals", locale], {
    tags: [SETTINGS_TAGS.globals],
  })();
}

// ── Navigation (header / footer trees) ─────────────────────────────────────────
async function _getNav(locale: Locale, location: NavLocation): Promise<NavLink[]> {
  const rows = await db
    .select({
      id: nav_item.id,
      parent_id: nav_item.parent_id,
      url: nav_item.url,
    })
    .from(nav_item)
    .where(eq(nav_item.location, location))
    .orderBy(asc(nav_item.position));
  if (rows.length === 0) return [];

  const content = await loadContent(
    rows.map((r) => ({ type: NAV_ITEM, id: r.id })),
    locale,
  );

  // Build nodes, then attach children — both iterations follow `position` order.
  const byId = new Map<string, NavLink>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      label: content.get(NAV_ITEM, r.id, "label") ?? r.url,
      url: r.url,
      children: [],
    });
  }
  const roots: NavLink[] = [];
  for (const r of rows) {
    const node = byId.get(r.id);
    if (!node) continue;
    const parent = r.parent_id ? byId.get(r.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export function getNav(locale: Locale, location: NavLocation): Promise<NavLink[]> {
  return unstable_cache(() => _getNav(locale, location), ["settings:getNav", locale, location], {
    tags: [SETTINGS_TAGS.nav],
  })();
}
