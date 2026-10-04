"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal for the About page's "How We Started" → "Our Structure" span only
 * (`.pre-reveal` hook, scoped to `[data-page="about"]` — other pages' neutralised
 * `.reveal` in mock.css is untouched). The hidden state is already in the
 * server-rendered markup, so content above the fold fades/slides in once on mount
 * (one clean transition, no flash) and content below the fold reveals on scroll.
 * `.reveal-stagger` containers get their direct children staggered via transition-delay.
 * Honours `prefers-reduced-motion`. Renders nothing.
 */
export function AboutReveal() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('.mk[data-page="about"] .pre-reveal'),
    );
    if (els.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const el of els) el.classList.remove("pre-reveal");
      return;
    }

    for (const group of document.querySelectorAll<HTMLElement>(
      '.mk[data-page="about"] .reveal-stagger',
    )) {
      Array.from(group.children).forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${Math.min(i * 70, 280)}ms`;
      });
    }

    const vh = window.innerHeight;
    const immediate = els.filter((el) => el.getBoundingClientRect().top < vh * 0.92);
    const deferred = els.filter((el) => !immediate.includes(el));

    for (const el of immediate) el.classList.remove("pre-reveal");
    if (deferred.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("pre-reveal");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    for (const el of deferred) io.observe(el);
    return () => io.disconnect();
  }, []);

  return null;
}
