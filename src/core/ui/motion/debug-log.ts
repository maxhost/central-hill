/**
 * Dev-only console instrumentation for diagnosing animation/scroll bugs that only show up
 * at certain viewport sizes ("works on mobile, breaks on desktop"). No-ops in production —
 * pure console output, no state, no visual change, zero runtime cost once built for prod.
 * Shared so every redesigned page wires the same breadcrumbs into `Reveal`/
 * `ScrollDebugProbe` instead of reinventing ad-hoc `console.log` each time.
 */
const ENABLED = process.env.NODE_ENV !== "production";

export function breakpointLabel(width: number): "mobile" | "tablet" | "desktop" {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function debugLog(tag: string, message: string, data?: Record<string, unknown>) {
  if (!ENABLED || typeof window === "undefined") return;
  const { innerWidth: w, innerHeight: h } = window;
  console.log(`[${tag}] ${message} — viewport ${w}x${h} (${breakpointLabel(w)})`, data ?? "");
}
