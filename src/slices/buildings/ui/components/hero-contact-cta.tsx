"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Portals `children` into the Buildings hero's static markup (`#hero-contact-slot`) — the
 * hero body is raw HTML (`dangerouslySetInnerHTML`), so a real client component can't sit
 * in it directly. The caller (a Server Component) passes an already-built element (e.g.
 * `<ContactDialog />`) as children rather than this file importing it itself: that element
 * may cross slices through `contract.ts`, and a barrel like `@slices/settings/contract` also
 * re-exports server-only code (`@core/media`/sharp) — importing it from a "use client" file
 * would drag that into the browser bundle and break the build.
 *
 * The slot only exists in the DOM, not in React's own tree, so its lookup must return `null`
 * during SSR and during the initial client hydration pass (matching the server output), then
 * resolve right after — `useSyncExternalStore`'s `getServerSnapshot` does exactly that. See
 * `src/slices/pages/ui/components/hero-contact-cta.tsx` (Owners hero) for the sibling copy of
 * this pattern — duplicated here rather than shared, since it isn't part of any slice's
 * public contract and is small enough to not be worth a kernel change.
 */
const noopSubscribe = () => () => {};
const getSnapshot = () => document.getElementById("hero-contact-slot");
const getServerSnapshot = () => null;

export function HeroContactCta({ children }: { children: ReactNode }) {
  const slot = useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);

  if (!slot) return null;

  return createPortal(children, slot);
}
