import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next 16 "proxy" convention (replaces the deprecated `middleware` file).
 * next-intl's handler is unchanged — it just lives here now. Handles locale
 * detection + path-prefix routing for the 4 locales.
 */
export default createMiddleware(routing);

export const config = {
  // Localize only public pages. Skip the non-localized surfaces — `/admin` (backoffice),
  // `/api` (incl. Better Auth), `/sitemaps/*` (SEO) — plus Next internals and any path
  // with a file extension (static assets, robots.txt, sitemap.xml, llms.txt). Without
  // the `admin` exclusion the middleware rewrites `/admin/login` → `/en/admin/login` (404).
  matcher: "/((?!api|admin|sitemaps|_next|_vercel|.*\\..*).*)",
};
