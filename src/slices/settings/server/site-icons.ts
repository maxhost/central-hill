import { isIconName } from "@core/ui/icons/names";
import { SITE_ICON_DEFAULTS, SITE_ICON_KEYS, type SiteIcons } from "../site-icons";

/** Stored `site_icons` → every key resolved: a missing or unknown name reads as the default. */
export function resolveSiteIcons(stored: Record<string, string> | null | undefined): SiteIcons {
  const out: SiteIcons = { ...SITE_ICON_DEFAULTS };
  for (const key of SITE_ICON_KEYS) {
    const name = stored?.[key];
    if (name && isIconName(name)) out[key] = name;
  }
  return out;
}
