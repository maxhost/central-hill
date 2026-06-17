"use client";

import { useEffect, useRef, useState } from "react";
import { ContactForm } from "@slices/leads/contract";
import { cn } from "@core/ui";

/**
 * Header "Contact" entry (client feedback B1). Mirrors LovelyStay: a contact option
 * sits in the top-right cluster next to the language selector and the owner-login
 * icon; clicking it opens the same message form used at the bottom of the Real Estate
 * page (the leads `ContactForm`, `kind = "contact"`). On submit the leads pipeline
 * persists the lead and emails staff (`LEAD_NOTIFY_TO` → partners@centralhill.pt).
 *
 * Pure client island: a button + a modal dialog (Escape / backdrop to close, focus
 * moved in on open, body scroll locked). Rendered once in the site header.
 */
export function ContactDialog({
  label,
  title,
  intro,
  variant = "link",
}: {
  label: string;
  title: string;
  intro: string;
  /** `link` = inline header text; `button` = bordered pill (mobile drawer). */
  variant?: "link" | "button";
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          variant === "button"
            ? "inline-flex items-center justify-center rounded-md border border-line px-7 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            : "text-sm text-ink-soft transition-colors hover:text-ink",
        )}
      >
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="relative w-full max-w-lg rounded-2xl bg-bg p-7 shadow-xl outline-none sm:p-9"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <span aria-hidden className="text-lg leading-none">
                ✕
              </span>
            </button>
            <h2 className="font-serif text-2xl text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{intro}</p>
            <ContactForm source="header-contact" className="mt-6" />
          </div>
        </div>
      ) : null}
    </>
  );
}
