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
 */
const DURATION_MS = 1600;
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

export function CountUp({ value, className }: { value: string; className?: string }) {
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
      const p = Math.min(1, (ts - startTs) / DURATION_MS);
      const n = Math.round(easeOutCubic(p) * target);
      setDisplay(`${prefix}${group(n, sep)}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
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
    // `value` fully determines `parsed`; re-run only when the figure changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className} aria-label={value}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
