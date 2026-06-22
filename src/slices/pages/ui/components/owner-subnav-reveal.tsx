"use client";

import { useEffect } from "react";

/**
 * Reveals the embedded mock owner sub-nav on scroll (replaces `mock/assets/site.js`):
 * toggles `.in` on `.mk .owner-subnav` once the page scrolls past the top, mirroring the
 * mock's `header.nav.scrolled ~ .owner-subnav` reveal. Renders nothing.
 */
export function OwnerSubnavReveal() {
  useEffect(() => {
    const el = document.querySelector(".mk .owner-subnav");
    if (!el) return;
    const onScroll = () => el.classList.toggle("in", window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
