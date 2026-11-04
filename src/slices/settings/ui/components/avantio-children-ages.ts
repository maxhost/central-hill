/**
 * The widget calls this framework hook after fetching its children-age fields.
 * Keep those fields inside the vendor form so its validation and serialization work,
 * without loading its--scripts.js (Bootstrap and automatic cookie acceptance).
 */
type AvantioWindow = Window & {
  abroPopupNinyosWebPlus?: (html: string) => void;
  validaEdades?: () => boolean;
};

const AGE_SELECTOR = 'select[id^="FRMEdadNinyo_"]';

export function installAvantioChildrenAges(container: HTMLElement): () => void {
  const vendor = window as AvantioWindow;
  const previousOpen = vendor.abroPopupNinyosWebPlus;
  let panel: HTMLDivElement | undefined;
  let active = true;

  const childrenInput = () => container.querySelector<HTMLSelectElement>("#FRMNinyos");

  function close(returnFocus = false) {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    // Hidden controls remain in the form and are still included by Avantio's serializer.
    if (returnFocus) childrenInput()?.focus({ preventScroll: true });
  }

  function open(html: string) {
    const trigger = childrenInput();
    const wrapper = trigger?.closest<HTMLElement>(".wrapper-FRMNinyos");
    const count = Number(trigger?.value);
    if (!active || !container.isConnected || !wrapper || !count) return;

    const next = document.createElement("div");
    next.className = "popover avantio-children-popover";
    next.setAttribute("role", "group");
    next.setAttribute("aria-label", trigger?.labels?.[0]?.textContent?.trim() || "Children");
    const content = document.createElement("div");
    content.className = "popover-content";
    content.innerHTML = html;
    next.appendChild(content);

    const fields = [...next.querySelectorAll<HTMLSelectElement>(AGE_SELECTOR)];
    // An earlier request can arrive after the visitor has changed the count again.
    if (fields.length !== count) return;

    const previousAges = new Map(
      [...(panel?.querySelectorAll<HTMLSelectElement>(AGE_SELECTOR) ?? [])].map(
        (field) => [field.id, field.value] as const,
      ),
    );
    for (const field of fields) {
      const value = previousAges.get(field.id);
      if (value !== undefined && [...field.options].some((option) => option.value === value)) {
        field.value = value;
      }
    }

    // The vendor appends a div as its OK action; retain its label and styling with
    // native keyboard behavior, and prevent it from submitting the search form.
    const action = next.querySelector<HTMLElement>(".cerrar_ninyos");
    if (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = action.className;
      button.textContent = action.textContent;
      action.replaceWith(button);
    }

    panel?.remove();
    panel = next;
    wrapper.appendChild(next);
    fields[0]?.focus({ preventScroll: true });
  }

  function onClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    if (panel?.contains(event.target) && event.target.closest(".cerrar_ninyos")) {
      if (vendor.validaEdades?.() === true) close(true);
    } else if (event.target === childrenInput() && panel?.hidden) {
      // Reopening the same count does not fire change or make another vendor request.
      if (panel.querySelectorAll(AGE_SELECTOR).length === Number(childrenInput()?.value)) {
        panel.hidden = false;
      }
    }
  }

  function onChange(event: Event) {
    if (event.target !== childrenInput()) return;
    close();
    if (!Number(childrenInput()?.value)) {
      panel?.remove();
      panel = undefined;
      const ages = container.querySelector<HTMLInputElement>("#EdadesNinyos");
      if (ages) ages.value = "";
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (!(event.target instanceof Node)) return;
    const wrapper = childrenInput()?.closest(".wrapper-FRMNinyos");
    if (!wrapper?.contains(event.target)) close();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && event.target === childrenInput() && panel?.hidden &&
        panel.querySelectorAll(AGE_SELECTOR).length === Number(childrenInput()?.value)) {
      event.preventDefault();
      panel.hidden = false;
      panel.querySelector<HTMLSelectElement>(AGE_SELECTOR)?.focus({ preventScroll: true });
    }
    if (event.key === "Escape" && panel && !panel.hidden) {
      event.preventDefault();
      close(true);
    }
  }

  vendor.abroPopupNinyosWebPlus = open;
  container.addEventListener("click", onClick);
  // Hide the previous fields before the inline onchange starts the vendor request.
  container.addEventListener("change", onChange, true);
  document.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("keydown", onKeyDown);

  return () => {
    active = false;
    panel?.remove();
    container.removeEventListener("click", onClick);
    container.removeEventListener("change", onChange, true);
    document.removeEventListener("pointerdown", onPointerDown);
    container.removeEventListener("keydown", onKeyDown);
    if (vendor.abroPopupNinyosWebPlus === open) {
      if (previousOpen) vendor.abroPopupNinyosWebPlus = previousOpen;
      else delete vendor.abroPopupNinyosWebPlus;
    }
  };
}
