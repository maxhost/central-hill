"use client";

import { useEffect } from "react";

/**
 * Reflect scroll state for the transparent/frosted header.
 * Renders nothing; CSS chooses the header appearance from this class and hero presence.
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
