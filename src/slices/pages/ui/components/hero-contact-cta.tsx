"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Portals `children` into the owner-hero's static markup (`#hero-contact-slot`) — the hero
 * body is raw HTML, so a real client component can't sit in it directly. The caller (a
 * Server Component) passes an already-built element (e.g. `<ContactDialog />`) as children
 * rather than this file importing it itself: that element may cross slices through
 * `contract.ts`, and that barrel also re-exports server-only code (`@core/media`/sharp) —
 * importing it from a "use client" file would drag that into the browser bundle and break
 * the build.
 *
 * The slot only exists in the DOM, not in React's own tree, so its lookup must return `null`
 * during SSR and during the initial client hydration pass (matching the server output), then
 * resolve right after — `useSyncExternalStore`'s `getServerSnapshot` does exactly that. A
 * `useState`/`useEffect` pair looks equivalent but isn't: computing the slot eagerly (e.g. in
 * a lazy `useState` initializer) makes the client's first render diverge from the server's,
 * which is a hydration mismatch, not a fix.
 */
const noopSubscribe = () => () => {};
const getSnapshot = () => document.getElementById("hero-contact-slot");
const getServerSnapshot = () => null;

export function HeroContactCta({ children }: { children: ReactNode }) {
  const slot = useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);

  if (!slot) return null;

  return createPortal(children, slot);
}
