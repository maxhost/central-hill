import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Allow Next/Image to fetch R2-served originals, derived from R2_PUBLIC_BASE_URL. */
function r2RemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return [];
  try {
    const url = new URL(base);
    return [{ protocol: url.protocol === "http:" ? "http" : "https", hostname: url.hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `sharp` (core/media resize, ADR 0018) is a native module — keep it external so the
  // bundler never inlines it and it loads its platform binary from node_modules at
  // runtime. Paired with pnpm `onlyBuiltDependencies: ["sharp"]` so the linux-x64 binary
  // is actually installed on Netlify (otherwise the admin bundle 500s: ERR_DLOPEN_FAILED
  // libvips on the serverless runtime).
  serverExternalPackages: ["sharp"],
  // A parent dir (~/claude-workspace) has its own lockfile/node_modules; pin the
  // root so Turbopack and file-tracing resolve modules from THIS project only
  // (otherwise a duplicate React resolves and breaks prerendering).
  turbopack: {
    root: import.meta.dirname,
  },
  outputFileTracingRoot: import.meta.dirname,
  // R2-backed media served from the public R2 base domain (ADR 0018). The host is
  // derived from R2_PUBLIC_BASE_URL so Next/Image (Netlify Image CDN today, Vercel's
  // if migrated) can fetch + resize originals at request time. Empty until configured.
  images: {
    remotePatterns: r2RemotePatterns(),
  },
};

export default withNextIntl(nextConfig);
