"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import { UiIcon, buttonClassName } from "@core/ui";
import { BREVO_NEWSLETTER_ACTION, BREVO_NEWSLETTER_TIMEOUT_MS, subscribeBrevoNewsletter } from "./brevo-newsletter";

/** Localized copy for the inline capture and its Brevo confirmation form. */
export interface FooterNewsletterLabels {
  placeholder: string;
  cta: string;
  ariaLabel: string;
  modalTitle: string;
  modalIntro: string;
  emailLabel: string;
  consentLabel: string;
  submit: string;
  pending: string;
  error: string;
  success: string;
  close: string;
}

/**
 * Footer newsletter signup (client feedback) — a compact inline email capture that sits
 * beside the "Are you a guest or an owner?" row, opening a modal (mirrors `ContactDialog`'s
 * hand-rolled dialog: Escape / backdrop to close, focus moved in on open, body scroll
 * locked) with its own email field — pre-filled from the inline input, still editable —
 * and the supplied Brevo HTML form's opt-in. Only final confirmation posts to Brevo;
 * opening the modal never subscribes anyone. Response handling stays inside the dialog.
 */
export function FooterNewsletter({ labels }: { labels: FooterNewsletterLabels }) {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const panelRef = useRef<HTMLDivElement>(null);
  const modalEmailRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const attemptRef = useRef(0);
  const pending = status === "pending";

  const closeModal = useCallback(() => {
    attemptRef.current++;
    requestRef.current?.abort();
    requestRef.current = null;
    setOpen(false);
  }, []);

  useEffect(() => () => {
    attemptRef.current++;
    requestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") {
        const items = panelRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled):not([tabindex='-1']), a[href]");
        const first = items?.[0];
        const last = items?.[items.length - 1];
        if (first && last && e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (first && last && !e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previousFocus = document.activeElement;
    modalEmailRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open, closeModal]);

  function openModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setModalEmail(email.trim());
    setConsent(false);
    setStatus("idle");
    setOpen(true);
  }

  async function submitModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (requestRef.current || !consent || !e.currentTarget.reportValidity()) return;
    const honeypot = new FormData(e.currentTarget).get("email_address_check");
    const attempt = ++attemptRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("pending");
    const timeout = window.setTimeout(() => controller.abort(), BREVO_NEWSLETTER_TIMEOUT_MS);
    const accepted = await subscribeBrevoNewsletter({
      email: modalEmail, consent, locale, honeypot: typeof honeypot === "string" ? honeypot : "",
    }, controller.signal);
    window.clearTimeout(timeout);
    if (attemptRef.current !== attempt) return;
    requestRef.current = null;
    setStatus(accepted ? "success" : "error");
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
          className="w-full min-w-0 flex-1 rounded-[3px] border border-white/25 bg-transparent px-4 py-[11px] text-[14px] leading-[1.6] text-on-feature placeholder:text-on-feature-soft/70 focus:border-white focus:outline-none"
        />
        <button
          type="submit"
          className={buttonClassName("primary", "shrink-0 whitespace-nowrap", "sm")}
        >
          {labels.cta}
        </button>
      </form>

      {open ? createPortal(
        <div
          data-chrome-keep
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
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
              onClick={closeModal}
              aria-label={labels.close}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <UiIcon name="xmark" size={28} />
            </button>
            <h2 className="font-serif text-2xl text-ink">{labels.modalTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{labels.modalIntro}</p>

            {status === "success" ? (
              <p role="status" className="mt-6 text-sm font-medium text-ink">{labels.success}</p>
            ) : (
              <form method="POST" action={BREVO_NEWSLETTER_ACTION} data-type="subscription" onSubmit={submitModal} aria-busy={pending} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="footer-newsletter-modal-email"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    {labels.emailLabel}
                  </label>
                  <input
                    id="footer-newsletter-modal-email"
                    ref={modalEmailRef}
                    name="EMAIL"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={pending}
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="w-full rounded-md border border-line px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <input
                    type="checkbox"
                    required
                    name="OPT_IN"
                    value="1"
                    checked={consent}
                    disabled={pending}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  />
                  {labels.consentLabel}
                </label>

                <input type="text" name="email_address_check" defaultValue="" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
                <input type="hidden" name="locale" value={locale} />

                {status === "error" ? <p role="alert" className="text-sm text-ink">{labels.error}</p> : null}

                <button
                  type="submit"
                  disabled={pending}
                  className={buttonClassName("primary", "w-full sm:w-auto")}
                >
                  {pending ? labels.pending : labels.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      , document.body) : null}
    </>
  );
}
