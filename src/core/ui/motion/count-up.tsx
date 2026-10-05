"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up for headline figures (client feedback B3 — "the numbers should
 * count up progressively, like a slot machine / digital counter, when they enter the
 * screen"). Used by the stats band (Home / Owners / About) and the Real Estate
 * "Performance You Can Measure" metrics.
 *
 * Parses a display string into `[prefix][number][suffix]` (e.g. `€55M+` → `€`,`55`,`M+`;
 * `60,000+` → ``,`60,000`,`+`), animates the integer from 0 to its value the first time
 * the element scrolls into view, and re-applies the original grouping separator. Honors
 * `prefers-reduced-motion` (renders the final value immediately) and degrades gracefully
 * to the static string when there is no parseable number or JS/IntersectionObserver is
 * unavailable. The accessible name is always the final value.
 *
 * `durationMs` (optional, default 4000ms — the original hardcoded value, so existing callers
 * are unchanged) was added for Real Estate's `StatTiles`, which reproduces the 1600ms tuning
 * of the `OwnerStatsCounter` island it replaced. When the animation settles the display snaps
 * to the exact original `value` string (as `OwnerStatsCounter` always did), so a figure whose
 * number isn't a plain grouped integer (e.g. "4.8★") still ends on its authored text instead
 * of the re-grouped integer — a no-op for every well-formed integer figure.
 *
 * The accessible text is an `sr-only` copy of the final `value` beside the `aria-hidden`
 * animated display — not an `aria-label` on the outer `<span>`, which (generic role) browsers
 * ignore, so with the display `aria-hidden` the figure used to drop out of the a11y tree.
 */
const DEFAULT_DURATION_MS = 4000;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface Parsed {
  prefix: string;
  suffix: string;
  target: number;
  sep: "" | "," | ".";
}

function parse(value: string): Parsed | null {
  const m = value.match(/^(\D*)([\d.,]+)(.*)$/s);
  if (!m) return null;
  const prefix = m[1] ?? "";
  const num = m[2] ?? "";
  const suffix = m[3] ?? "";
  const digits = num.replace(/[.,]/g, "");
  if (!digits) return null;
  const target = Number.parseInt(digits, 10);
  if (!Number.isFinite(target)) return null;
  // Stats are integers; a separator is thousands grouping we want to preserve.
  const sep = num.includes(",") ? "," : num.includes(".") ? "." : "";
  return { prefix, suffix, target, sep };
}

function group(n: number, sep: "" | "," | "."): string {
  if (!sep) return String(n);
  return n.toLocaleString("en-US").replace(/,/g, sep);
}

export function CountUp({
  value,
  className,
  durationMs = DEFAULT_DURATION_MS,
}: {
  value: string;
  className?: string;
  /** Count-up duration in ms (default 4000). */
  durationMs?: number;
}) {
  const parsed = parse(value);
  const ref = useRef<HTMLElement>(null);
  // SSR / no-JS / unparseable → show the final value immediately.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!parsed) return;
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") return;

    const { prefix, suffix, target, sep } = parsed;

    let raf = 0;
    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / durationMs);
      if (p < 1) {
        const n = Math.round(easeOutCubic(p) * target);
        setDisplay(`${prefix}${group(n, sep)}${suffix}`);
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value); // exact original text once settled
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          // Reset to zero (inside the callback, not the effect body) then count up.
          setDisplay(`${prefix}${group(0, sep)}${suffix}`);
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // `value` fully determines `parsed`; re-run only when the figure/duration changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
