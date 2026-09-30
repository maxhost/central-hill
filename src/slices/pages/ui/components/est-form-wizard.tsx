"use client";

import { useEffect } from "react";

const STEPS = 3;

/**
 * Wires up the 3-step earnings-estimate form (static markup, `[data-wizard]` +
 * `[data-panel="1|2|3"]`): `[data-wiz-next]`/`[data-wiz-back]` clicks swap the visible
 * panel and update the progress dots. Purely client-side navigation — no submission
 * wiring yet (see the slice README: the form is still markup-only). Renders nothing.
 */
export function EstFormWizard() {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(".mk [data-wizard]");
    if (!form) return;

    const panels = Array.from(form.querySelectorAll<HTMLElement>("[data-panel]"));
    const dots = Array.from(form.querySelectorAll<HTMLElement>("[data-dot]"));

    const show = (step: number) => {
      form.dataset.step = String(step);
      for (const panel of panels) panel.hidden = Number(panel.dataset.panel) !== step;
      for (const dot of dots) dot.classList.toggle("done", Number(dot.dataset.dot) <= step);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const next = target.closest("[data-wiz-next]");
      const back = target.closest("[data-wiz-back]");
      if (!next && !back) return;
      const current = Number(form.dataset.step ?? "1");
      show(next ? Math.min(STEPS, current + 1) : Math.max(1, current - 1));
    };

    form.addEventListener("click", onClick);
    show(1);
    return () => form.removeEventListener("click", onClick);
  }, []);

  return null;
}
