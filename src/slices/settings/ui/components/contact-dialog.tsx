"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ContactForm } from "@slices/leads/contract";
import { UiIcon, buttonClassName, cn } from "@core/ui";

/**
 * Contact entry point (client feedback B1). Mirrors LovelyStay: a contact option sits
 * in the top-right cluster next to the language selector and the owner-login icon;
 * clicking it opens the same message form used at the bottom of the Real Estate page
 * (the leads `ContactForm`, `kind = "contact"`). On submit the leads pipeline persists
 * the lead and emails staff (`LEAD_NOTIFY_TO` → partners@centralhill.pt). Also reused as
 * a hero CTA on the Owners page (`source="owners-hero"`).
 *
 * Pure client island: a button + a modal dialog (Escape / backdrop to close, focus
 * moved in on open, body scroll locked). The dialog itself is portaled to `document.body`
 * — the trigger can live anywhere (including inside a scoped stylesheet, e.g. the Owners
 * hero's `.mk` design system), but the modal must render outside any such scope so its
 * own Tailwind styling isn't overridden by an ancestor's CSS (e.g. `.mk *`'s
 * margin/padding reset).
 */
export function ContactDialog({
  label,
  title,
  intro,
  variant = "link",
  icon,
  source = "header-contact",
}: {
  label: string;
  title: string;
  intro: string;
  /**
   * `link` = inline header text; `button` = bordered pill (mobile drawer);
   * `icon` = round envelope icon (header top-right cluster, next to owner-login);
   * `light` = white hairline pill for use over dark media (e.g. a hero image).
   */
  variant?: "link" | "button" | "icon" | "light";
  /** `icon` variant's glyph (e.g. a server-rendered `<Icon>`); defaults to Iconoir `mail`. */
  icon?: ReactNode;
  /** Lead source tag stored with the submission; defaults to the header trigger's own tag. */
  source?: string;
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
        aria-label={variant === "icon" ? label : undefined}
        title={variant === "icon" ? label : undefined}
        data-icon-btn={variant === "icon" ? "" : undefined}
        className={cn(
          variant === "button" && buttonClassName("outline"),
          variant === "light" && buttonClassName("light"),
          variant === "icon" &&
            "inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink",
          variant === "link" && "text-sm text-ink-soft transition-colors hover:text-ink",
        )}
      >
        {variant === "icon" ? (
          (icon ?? <UiIcon name="mail" size={20} />)
        ) : (
          label
        )}
      </button>

      {open
        ? createPortal(
            <div
              data-chrome-keep
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
                  <UiIcon name="xmark" size={28} />
                </button>
                <h2 className="font-serif text-2xl text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{intro}</p>
                <ContactForm source={source} className="mt-6" />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
