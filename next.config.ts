import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A parent dir (~/claude-workspace) has its own lockfile/node_modules; pin the
  // root so Turbopack and file-tracing resolve modules from THIS project only
  // (otherwise a duplicate React resolves and breaks prerendering).
  turbopack: {
    root: import.meta.dirname,
  },
  outputFileTracingRoot: import.meta.dirname,
  // R2-backed media is served from a custom domain; remote patterns added when wired.
  images: {
    remotePatterns: [],
  },
};

export default withNextIntl(nextConfig);
