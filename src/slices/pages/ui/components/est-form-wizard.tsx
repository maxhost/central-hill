"use client";

import { useEffect } from "react";

const STEPS = 3;

/**
 * Wires up the 3-step earnings-estimate form (`OwnerEstimateForm`'s `[data-wizard]` +
 * `[data-panel="1|2|3"]`, found document-wide — it's a page-unique element, no longer
 * nested in the `.mk` raw-markup wrapper now that the Owners hero is real JSX):
 * `[data-wiz-next]`/`[data-wiz-back]` clicks swap the visible panel and update the
 * progress dots. Purely client-side navigation — no submission wiring yet (see the slice
 * README: the form is still markup-only), so real `submit` events (e.g. pressing Enter in
 * a text field) are prevented here rather than via an inline `onSubmit` — the form itself
 * is server-rendered markup (`OwnerEstimateForm`), and a Server Component can't pass an
 * event-handler prop. Renders nothing.
 */
export function EstFormWizard() {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>("[data-wizard]");
    if (!form) return;

    const onSubmit = (e: SubmitEvent) => e.preventDefault();
    form.addEventListener("submit", onSubmit);

    const panels = Array.from(form.querySelectorAll<HTMLElement>("[data-panel]"));
    const dots = Array.from(form.querySelectorAll<HTMLElement>("[data-dot]"));

    const show = (step: number) => {
      form.dataset.step = String(step);
      for (const panel of panels) panel.hidden = Number(panel.dataset.panel) !== step;
      for (const dot of dots) {
        const done = Number(dot.dataset.dot) <= step;
        dot.classList.toggle("bg-accent", done);
        dot.classList.toggle("bg-line", !done);
      }
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
    return () => {
      form.removeEventListener("click", onClick);
      form.removeEventListener("submit", onSubmit);
    };
  }, []);

  return null;
}
