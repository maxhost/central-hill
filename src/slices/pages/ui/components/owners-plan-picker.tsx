"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { PricingCards, UiIcon, buttonClassName } from "@core/ui";
import { OwnerEstimateForm } from "./owner-estimate-form";

type FormCopy = Omit<
  ComponentProps<typeof OwnerEstimateForm>,
  "selectedPackages" | "idPrefix"
>;
type Props = Omit<
  ComponentProps<typeof PricingCards>,
  "renderSummaryAction"
> & { form: FormCopy };

/** Owns the dialog at the slice boundary; PricingCards only provides the selection. */
export function OwnersPlanPicker({ form, ...pricing }: Props) {
  const t = useTranslations("pages.estimateForm");
  const modalId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <PricingCards
        {...pricing}
        renderSummaryAction={(selected) => (
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              setSelectedPackages(selected.map((tier) => tier.name));
              setOpen(true);
            }}
            className={buttonClassName(
              "primary",
              "col-span-2 w-full min-w-0 min-[681px]:col-span-1",
              "sm",
            )}
          >
            {pricing.summary?.cta.label}
          </button>
        )}
      />
      {open
        ? createPortal(
            <dialog
              ref={dialogRef}
              aria-label={form.headline}
              aria-modal="true"
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const controls = Array.from(
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                  ),
                ).filter((control) => control.getClientRects().length > 0);
                const first = controls[0];
                const last = controls.at(-1);
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }}
              onCancel={(event) => {
                event.preventDefault();
                setOpen(false);
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  if (
                    event.clientX < bounds.left ||
                    event.clientX > bounds.right ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom
                  )
                    setOpen(false);
                }
              }}
              className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto overscroll-contain rounded-lg border-0 bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/50"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("closeDialog")}
                className="absolute right-3 top-3 z-10 inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-bg hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <UiIcon name="xmark" size={24} />
              </button>
              <div className="[&_form]:pt-16">
                <OwnerEstimateForm
                  {...form}
                  selectedPackages={selectedPackages}
                  idPrefix={modalId}
                />
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
