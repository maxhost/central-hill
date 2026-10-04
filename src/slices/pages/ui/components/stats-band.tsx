import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { StatBand } from "@core/ui";
import { type StatKey, getGlobals } from "@slices/settings/contract";

/**
 * Company-wide stats band — data composer for the presentational `StatBand`
 * (`core/ui/stat-band.tsx`, ADR 0033). Reads the figures from the settings singleton
 * (`getGlobals`) — NOT from page `data` (data-model.md → stats = company_settings). The
 * eyebrow/title are UI chrome (`pages` namespace). Renders nothing when settings are
 * unset. Subscribes to the `globals` cache tag transitively via `getGlobals`. Only `HomePage`
 * uses this today — `OwnersPage`'s "numbers" band renders `StatBand` directly with its own
 * per-page `content.stats` figures instead, which deliberately differ from the company-wide
 * ones here (see `pages/README.md`).
 */
export async function StatsBand({
  locale,
  keys,
  showTitle = true,
}: {
  locale: Locale;
  keys: StatKey[];
  /** Hide the centred heading for a bare proof band (Owners, mirroring the mock). */
  showTitle?: boolean;
}) {
  const globals = await getGlobals(locale);
  if (!globals) return null;

  const cells = keys.map((k) => globals.stats[k]).filter((s) => s && s.value);
  if (cells.length === 0) return null;

  const t = await getTranslations("pages");

  return <StatBand title={showTitle ? t("stats.title") : undefined} cells={cells} />;
}
