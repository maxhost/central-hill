"use client";

import { useEffect } from "react";

/**
 * App-shell header chrome (client island). Mirrors `mock/assets/site.js`: toggles the
 * `scrolled` class on `[data-site-header]` once the page scrolls past the top. Whether the
 * header is transparent over a hero or frosted is decided purely in CSS (`globals.css`
 * `body:has([data-hero]) [data-site-header]:not(.scrolled)`), so this island carries no
 * state and renders nothing — it only reflects scroll position.
 */
export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
