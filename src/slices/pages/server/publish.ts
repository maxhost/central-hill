import "server-only";
import { revalidatePath, updateTag } from "@core/revalidate";
import { routing } from "@/i18n/routing";
import type { PageKey } from "../schemas";
import { PAGE_TAGS } from "../contract";

/**
 * Revalidation for the editable fixed pages (slice `pages`). Called by the S12 admin
 * publish action after a page row is saved+published. Busts the page's `page:<key>` tag
 * and revalidates its route for every locale (data-model.md → "On save+publish →
 * `revalidatePath('/{locale}/<page>')` for all 4 locales").
 */

/** `page_content.key` → its URL segment (`home` is the locale root). */
const PAGE_PATH: Record<PageKey, string> = {
  home: "",
  owners: "owners",
  guest: "guests",
  real_estate: "real-estate",
  about: "about",
};

export function revalidatePage(key: PageKey): void {
  updateTag(PAGE_TAGS.page(key));
  const segment = PAGE_PATH[key];
  for (const locale of routing.locales) {
    revalidatePath(segment ? `/${locale}/${segment}` : `/${locale}`);
  }
}
