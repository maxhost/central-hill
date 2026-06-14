import "server-only";
import { LOCALES } from "@core/db/columns";
import { cacheTags, revalidatePath, updateTag } from "@core/revalidate";
import { SETTINGS_TAGS } from "../contract";

/**
 * Single place that busts settings ISR caches on publish (conventions.md → "don't
 * scatter revalidateTag calls"). The settings admin actions (S12) call this after a
 * successful persist + translation enqueue.
 *
 * Globals and nav are *embedded* in the app-shell layout (header/footer) on every
 * page, so besides the `globals`/`nav` tags we revalidate each locale's layout tree.
 * Consumers that embed globals (e.g. S9 pages: stats, default OG image) also subscribe
 * to `SETTINGS_TAGS.globals` so busting it here cascades the refresh.
 */
export function revalidateGlobals(): void {
  updateTag(SETTINGS_TAGS.globals);
  updateTag(cacheTags.sitemap);
  for (const locale of LOCALES) revalidatePath(`/${locale}`, "layout");
}

export function revalidateNav(): void {
  updateTag(SETTINGS_TAGS.nav);
  for (const locale of LOCALES) revalidatePath(`/${locale}`, "layout");
}
