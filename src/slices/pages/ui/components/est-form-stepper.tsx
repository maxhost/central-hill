"use client";

import { useEffect } from "react";

/**
 * Wires up the "Nº of Properties" stepper in the earnings-estimate form (static markup,
 * `[data-stepper]`): the +/- buttons adjust a count (never below `data-min`), keeping the
 * visible figure, the hidden field value, and the minus button's disabled state in sync.
 * Event-delegated on `.mk`, so it needs no per-instance wiring. Renders nothing.
 */
export function EstFormStepper() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".mk");
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-step]");
      if (!btn) return;
      const stepper = btn.closest<HTMLElement>("[data-stepper]");
      if (!stepper) return;

      const min = Number(stepper.dataset.min ?? "1");
      const current = Number(stepper.dataset.value ?? String(min));
      const next = Math.max(min, current + (btn.dataset.step === "up" ? 1 : -1));
      if (next === current) return;

      stepper.dataset.value = String(next);
      const val = stepper.querySelector<HTMLElement>(".step-val");
      if (val) val.textContent = String(next);
      const input = stepper.querySelector<HTMLInputElement>("input[type=hidden]");
      if (input) input.value = String(next);
      const minusBtn = stepper.querySelector<HTMLButtonElement>('[data-step="down"]');
      if (minusBtn) minusBtn.disabled = next <= min;
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  return null;
}
