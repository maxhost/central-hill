"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { UiIcon } from "@core/ui";

/** Copy for the whole widget — plain props for now (i18n `settings.footer.newsletter.*`);
 *  will move to the backoffice once this section is wired to a real destination. */
export interface FooterNewsletterLabels {
  placeholder: string;
  cta: string;
  ariaLabel: string;
  modalTitle: string;
  modalIntro: string;
  emailLabel: string;
  termsLabel: string;
  marketingLabel: string;
  submit: string;
  success: string;
  close: string;
}

/**
 * Footer newsletter signup (client feedback) — a compact inline email capture that sits
 * beside the "Are you a guest or an owner?" row, opening a modal (mirrors `ContactDialog`'s
 * hand-rolled dialog: Escape / backdrop to close, focus moved in on open, body scroll
 * locked) with its own email field — pre-filled from the inline input, still editable —
 * and two consent checkboxes (terms, required; marketing, optional).
 *
 * UI only for now (client direction): nothing is submitted anywhere yet — no `leads`/provider
 * wiring — the modal just swaps to a static confirmation on submit.
 */
export function FooterNewsletter({ labels }: { labels: FooterNewsletterLabels }) {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  function openModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setModalEmail(email);
    setSubmitted(false);
    setOpen(true);
  }

  function submitModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <form onSubmit={openModal} className="flex w-full max-w-sm items-center gap-2 sm:w-auto">
        <label className="sr-only" htmlFor="footer-newsletter-email">
          {labels.ariaLabel}
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.placeholder}
          className="w-full min-w-0 flex-1 rounded-[3px] border border-white/25 bg-transparent px-4 py-2.5 text-sm text-on-feature placeholder:text-on-feature-soft/70 focus:border-white focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 whitespace-nowrap rounded-[3px] bg-accent px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
        >
          {labels.cta}
        </button>
      </form>

      {open ? (
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
            aria-label={labels.modalTitle}
            tabIndex={-1}
            className="relative w-full max-w-lg rounded-2xl bg-bg p-7 shadow-xl outline-none sm:p-9"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <UiIcon name="xmark" size={28} />
            </button>
            <h2 className="font-serif text-2xl text-ink">{labels.modalTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{labels.modalIntro}</p>

            {submitted ? (
              <p className="mt-6 text-sm font-medium text-ink">{labels.success}</p>
            ) : (
              <form onSubmit={submitModal} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="footer-newsletter-modal-email"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    {labels.emailLabel}
                  </label>
                  <input
                    id="footer-newsletter-modal-email"
                    type="email"
                    required
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="w-full rounded-md border border-line px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <input
                    type="checkbox"
                    required
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  />
                  {labels.termsLabel}
                </label>

                <label className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  />
                  {labels.marketingLabel}
                </label>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep sm:w-auto"
                >
                  {labels.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
