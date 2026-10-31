"use client";

import { useEffect } from "react";

/**
 * Header chrome: scroll state for section navigation and shared gradient coordinates
 * for the owner tab. Renders nothing; observes layout without React state.
 */
export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;
    const earn = header.querySelector<HTMLElement>('[data-cta="earn"]');
    const panels = header.querySelectorAll<HTMLElement>("[data-subnav-panel]");
    const alignGradient = () => {
      if (!earn) return;
      const headerRect = header.getBoundingClientRect();
      const earnRect = earn.getBoundingClientRect();
      earn.style.setProperty("--header-gradient-width", `${headerRect.width}px`);
      earn.style.setProperty("--earn-gradient-offset", `${headerRect.left - earnRect.left}px`);
      const subnavHeight = Math.max(0, ...Array.from(panels, (panel) => panel.getBoundingClientRect().height));
      earn.style.setProperty("--header-subnav-height", `${subnavHeight}px`);
    };
    alignGradient();
    const observer = new ResizeObserver(alignGradient);
    observer.observe(header);
    panels.forEach((panel) => observer.observe(panel));
    header.querySelectorAll("nav, .header-utilities, [data-brand], [data-cta='earn']")
      .forEach((element) => observer.observe(element));
    window.addEventListener("resize", alignGradient);
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", alignGradient);
      observer.disconnect();
    };
  }, []);

  return null;
}
