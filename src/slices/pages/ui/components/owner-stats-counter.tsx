"use client";

import { useEffect } from "react";

/**
 * Animates the owners "numbers" band: each `[data-count]` figure counts up from 0 to its
 * `data-to` target the first time it scrolls into view (IntersectionObserver), then snaps
 * to its exact original text (e.g. "400,000+", "€55M+"). Honours `prefers-reduced-motion`
 * by jumping straight to the final value. Renders nothing.
 */
const DURATION = 1600;

export function OwnerStatsCounter() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".mk [data-count]"));
    if (els.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = (el: HTMLElement) => {
      const final = el.textContent ?? "";
      const to = Number(el.dataset.to ?? "0");
      const prefix = el.dataset.prefix ?? "";
      const suffix = el.dataset.suffix ?? "";
      const group = el.dataset.group === "true";
      if (reduce || !to) {
        el.textContent = final;
        return;
      }
      const fmt = (n: number) =>
        `${prefix}${group ? n.toLocaleString("en-US") : String(n)}${suffix}`;
      let start: number | null = null;
      const tick = (now: number) => {
        if (start === null) start = now;
        const p = Math.min((now - start) / DURATION, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        if (p < 1) {
          el.textContent = fmt(Math.round(to * eased));
          requestAnimationFrame(tick);
        } else {
          el.textContent = final; // exact original (keeps "400,000+", "€55M+")
        }
      };
      el.textContent = fmt(0);
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            run(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);

  return null;
}
