import type { PageKey } from "../schemas";

/** Shared order for the Pages list and the visual editor's page navigator. */
export const PAGE_ADMIN_ORDER = [
  "home",
  "owners",
  "buildings",
  "real_estate",
  "guest",
  "guides",
  "services",
  "about",
  "blog",
] as const satisfies readonly PageKey[];
