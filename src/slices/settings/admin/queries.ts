import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadContent } from "@core/i18n/content";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { COMPANY_SETTINGS, NAV_ITEM, type NavLocation, type StatKey } from "../contract";
import { DEFAULT_GLOBALS } from "../defaults";
import { company_settings, nav_item } from "../schema";

/**
 * Backoffice reads for slice `settings` (S12). Not cache-wrapped (admin is dynamic).
 * The globals editor falls back to `DEFAULT_GLOBALS` when no row exists yet so the
 * form always renders; [T] labels resolve from the source-locale (`en`) translation
 * rows, falling back to the inline jsonb labels.
 */

const SOURCE = "en" as const;

const STAT_KEYS: StatKey[] = ["bookings", "years", "guests", "revenue", "buildings", "apartments"];

export interface StatForm {
  value: string;
  label: string;
}

export interface GlobalsEditData {
  email: string;
  phone: string;
  whatsapp: string;
  social: Record<"instagram" | "facebook" | "linkedin" | "youtube" | "tiktok", string>;
  stats: Record<StatKey, StatForm>;
  office_address: string;
  office_hours: string;
  office_hours_label: string;
  currency: "EUR";
  default_og_image_media_id: string;
  avantio_account_id: string;
  /** Pretty-printed JSON for the textarea editor. */
  avantio_widget_config: string;
  show_building_location: boolean;
  show_building_count: boolean;
}

export interface GlobalsEditBundle {
  data: GlobalsEditData;
  previews: Record<string, AdminMediaPreview>;
}

const EMPTY_SOCIAL = { instagram: "", facebook: "", linkedin: "", youtube: "", tiktok: "" };

/** Scaffold the form from `DEFAULT_GLOBALS` when no settings row exists yet. */
function scaffold(): GlobalsEditBundle {
  const stats = {} as Record<StatKey, StatForm>;
  for (const key of STAT_KEYS) {
    stats[key] = { value: DEFAULT_GLOBALS.stats[key].value, label: DEFAULT_GLOBALS.stats[key].label };
  }
  return {
    data: {
      email: DEFAULT_GLOBALS.email,
      phone: DEFAULT_GLOBALS.phone,
      whatsapp: DEFAULT_GLOBALS.whatsapp ?? "",
      social: { ...EMPTY_SOCIAL },
      stats,
      office_address: DEFAULT_GLOBALS.officeAddress,
      office_hours: DEFAULT_GLOBALS.officeHours ?? "",
      office_hours_label: DEFAULT_GLOBALS.officeHoursLabel ?? "",
      currency: "EUR",
      default_og_image_media_id: "",
      avantio_account_id: DEFAULT_GLOBALS.avantio.accountId,
      avantio_widget_config: "{}",
      show_building_location: DEFAULT_GLOBALS.showBuildingLocation,
      show_building_count: DEFAULT_GLOBALS.showBuildingCount,
    },
    previews: {},
  };
}

export async function getGlobalsForEdit(): Promise<GlobalsEditBundle> {
  const [row] = await db
    .select()
    .from(company_settings)
    .orderBy(asc(company_settings.created_at))
    .limit(1);
  if (!row) return scaffold();

  const content = await loadContent([{ type: COMPANY_SETTINGS, id: row.id }], SOURCE);

  const stats = {} as Record<StatKey, StatForm>;
  for (const key of STAT_KEYS) {
    const raw = row.stats[key];
    stats[key] = {
      value: raw?.value ?? "",
      label: content.get(COMPANY_SETTINGS, row.id, `stats.${key}.label`) ?? raw?.label ?? "",
    };
  }

  const social = { ...EMPTY_SOCIAL };
  for (const key of Object.keys(social) as (keyof typeof social)[]) {
    social[key] = row.social[key] ?? "";
  }

  const data: GlobalsEditData = {
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp ?? "",
    social,
    stats,
    office_address: row.office_address,
    office_hours: row.office_hours ?? "",
    office_hours_label:
      content.get(COMPANY_SETTINGS, row.id, "office_hours_label") ?? row.office_hours_label ?? "",
    currency: "EUR",
    default_og_image_media_id: row.default_og_image_media_id ?? "",
    avantio_account_id: row.avantio_account_id,
    avantio_widget_config: JSON.stringify(row.avantio_widget_config ?? {}, null, 2),
    show_building_location: row.show_building_location,
    show_building_count: row.show_building_count,
  };

  const previews = await resolvePreviews([row.default_og_image_media_id]);
  return { data, previews };
}

// ── Navigation ─────────────────────────────────────────────────────────────────
export interface NavLinkEdit {
  id?: string;
  url: string;
  label: string;
}
export interface NavParentEdit extends NavLinkEdit {
  children: NavLinkEdit[];
}
export interface NavigationEditData {
  header: NavParentEdit[];
  footer: NavParentEdit[];
}

export async function getNavigationForEdit(): Promise<NavigationEditData> {
  const rows = await db
    .select({
      id: nav_item.id,
      location: nav_item.location,
      parent_id: nav_item.parent_id,
      url: nav_item.url,
    })
    .from(nav_item)
    .orderBy(asc(nav_item.position));

  const content = await loadContent(
    rows.map((r) => ({ type: NAV_ITEM, id: r.id })),
    SOURCE,
  );
  const labelOf = (id: string, url: string) => content.get(NAV_ITEM, id, "label") ?? url;

  const build = (location: NavLocation): NavParentEdit[] => {
    const top = rows.filter((r) => r.location === location && !r.parent_id);
    return top.map((t) => ({
      id: t.id,
      url: t.url,
      label: labelOf(t.id, t.url),
      children: rows
        .filter((r) => r.parent_id === t.id)
        .map((c) => ({ id: c.id, url: c.url, label: labelOf(c.id, c.url) })),
    }));
  };

  return { header: build("header"), footer: build("footer") };
}

async function resolvePreviews(ids: (string | null)[]): Promise<Record<string, AdminMediaPreview>> {
  const clean = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (clean.length === 0) return {};
  const assets = await loadMedia(clean);
  const out: Record<string, AdminMediaPreview> = {};
  for (const [mid, a] of assets) {
    out[mid] = { id: mid, url: mediaUrl(a.r2_key), width: a.width, height: a.height, mime: a.mime };
  }
  return out;
}
