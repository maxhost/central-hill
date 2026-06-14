import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next 16 "proxy" convention (replaces the deprecated `middleware` file).
 * next-intl's handler is unchanged — it just lives here now. Handles locale
 * detection + path-prefix routing for the 4 locales.
 */
export default createMiddleware(routing);

export const config = {
  // Skip API, Next internals, and anything with a file extension (static assets).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
