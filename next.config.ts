import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Fail the build rather than ship broken images (ADR 0024).
 *
 * `images.remotePatterns` below is computed from `R2_PUBLIC_BASE_URL` **at build time**.
 * If the variable is absent when the build runs, the list is `[]` — and then every
 * optimised R2 image returns 400 at runtime while the dashboard shows the variable
 * present and correct, because it simply arrived too late. That is a silent, expensive
 * failure with a misleading symptom, so a production build without it stops here.
 */
function assertR2PublicBaseUrl(): void {
  if (process.env.R2_PUBLIC_BASE_URL) return;
  throw new Error(
    "R2_PUBLIC_BASE_URL is missing at BUILD time.\n" +
      "Next computes images.remotePatterns from it during the build, so a build without " +
      "it produces a deployment where every optimised R2 image 400s at runtime.\n" +
      "Set it in the build environment (Vercel → Settings → Environment Variables, all " +
      "three environments) and redeploy — see docs/specs/r2-runbook.md §B.",
  );
}

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
  // R2-backed media served from the public R2 base domain (ADR 0018/0024). The host is
  // derived from R2_PUBLIC_BASE_URL so Next/Image can fetch + resize originals at request
  // time — which is also what keeps visitors off the r2.dev host. Asserted above.
  images: {
    remotePatterns: r2RemotePatterns(),
    // AVIF first, WebP for anything that can't take it (ADR 0028). Next's default is
    // WebP only. Measured on two real catalogue interiors at the widths we actually
    // serve: AVIF is 12–33% smaller with encode time within noise of WebP (1.0–1.2x).
    // The usual "AVIF encodes 2–5x slower" is real, but it is a property of sharp's
    // defaults, not of what Next asks for — Next encodes AVIF at `quality - 20` with
    // `effort: 3`, which is where both the saving and the speed come from. Ordered
    // by preference: the first entry the Accept header supports is what gets served.
    formats: ["image/avif", "image/webp"],
  },
};

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) assertR2PublicBaseUrl();
  return withNextIntl(nextConfig);
}
