"use client";

import { type ReactNode, useId } from "react";
import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";
import { type AboutListOperation } from "../form-model";

/** About list rows use persistent identities as React keys and translation keys. */
export function AboutListEditor({ label, itemLabel, addLabel, items, ids, min, max, renderItem, createItem, onChange, error, fixedOrder, required = false, feedbackPath }: {
  label: string;
  itemLabel: string;
  addLabel: string;
  items: unknown[];
  ids: string[];
  min: number;
  max: number;
  renderItem: (item: unknown, index: number) => ReactNode;
  createItem: () => unknown;
  onChange: (operation: AboutListOperation) => void;
  error?: string;
  fixedOrder?: boolean;
  required?: boolean;
  feedbackPath?: string;
}) {
  const errorId = useId();
  const tb = useTranslations("backoffice");
  const t = useTranslations("pages");
  const actions = [
    { action: "up", icon: "arrow-up", label: "media.moveUp" },
    { action: "down", icon: "arrow-down", label: "media.moveDown" },
    { action: "remove", icon: "xmark", label: "media.remove" },
  ] as const;
  return <div role="group" aria-label={label} aria-describedby={error ? errorId : undefined} data-feedback-path={feedbackPath} className={`space-y-3 ${error && feedbackPath ? "[&_button]:border-red-600" : ""}`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}{required ? <span className="ml-0.5 text-accent-deep">*</span> : null}</p>
    <p className="text-xs text-ink-soft" role="status">{t("admin.aboutListBounds", { count: items.length, min, max })}</p>
    {required ? <p className="text-xs text-ink-soft">{min === max ? `Keep exactly ${min} ${min === 1 ? "item" : "items"} in this group.` : `Keep at least ${min} ${min === 1 ? "item" : "items"} in this group.`} Individual optional fields can remain empty.</p> : null}
    {error ? <p id={errorId} role="alert" className={`text-sm ${feedbackPath ? "text-red-700" : "text-accent-deep"}`}>{error}</p> : null}
    {items.map((item, index) => <div key={ids[index]} className="space-y-3 rounded-md border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink-soft">{itemLabel} {index + 1}</span>
        <div className="flex items-center gap-1">{actions.filter(({ action }) => !fixedOrder || action === "remove").map(({ action, icon, label: actionLabel }) =>
          <button key={action} type="button" aria-label={`${tb(actionLabel)}: ${itemLabel} ${index + 1}`} title={tb(actionLabel)}
            disabled={action === "up" ? index === 0 : action === "down" ? index === items.length - 1 : items.length <= min}
            onClick={() => onChange(action === "remove" ? { action: "remove", index } : { action: "move", index, to: index + (action === "up" ? -1 : 1) })}
            className="rounded p-2 text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-30">
            <UiIcon name={icon} size={16} />
          </button>)}</div>
      </div>
      {renderItem(item, index)}
    </div>)}
    {!fixedOrder && items.length < max ? <button type="button" aria-describedby={error ? errorId : undefined} className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-accent"
      onClick={() => onChange({ action: "add", value: createItem(), id: crypto.randomUUID() })}>+ {addLabel}</button> : null}
  </div>;
}
