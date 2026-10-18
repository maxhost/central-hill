"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";
import { type AboutListOperation } from "../form-model";

/** About list rows use persistent identities as React keys and translation keys. */
export function AboutListEditor({ label, itemLabel, addLabel, items, ids, min, max, renderItem, createItem, onChange, error }: {
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
}) {
  const tb = useTranslations("backoffice");
  const t = useTranslations("pages");
  const actions = [
    { action: "up", icon: "arrow-up", label: "media.moveUp" },
    { action: "down", icon: "arrow-down", label: "media.moveDown" },
    { action: "remove", icon: "xmark", label: "media.remove" },
  ] as const;
  return <div className="space-y-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
    <p className="text-xs text-ink-soft" role="status">{t("admin.aboutListBounds", { count: items.length, min, max })}</p>
    {error ? <p role="alert" className="text-sm text-accent-deep">{error}</p> : null}
    {items.map((item, index) => <div key={ids[index]} className="space-y-3 rounded-md border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink-soft">{itemLabel} {index + 1}</span>
        <div className="flex items-center gap-1">{actions.map(({ action, icon, label: actionLabel }) =>
          <button key={action} type="button" aria-label={`${tb(actionLabel)}: ${itemLabel} ${index + 1}`} title={tb(actionLabel)}
            disabled={action === "up" ? index === 0 : action === "down" ? index === items.length - 1 : items.length <= min}
            onClick={() => onChange(action === "remove" ? { action: "remove", index } : { action: "move", index, to: index + (action === "up" ? -1 : 1) })}
            className="rounded p-2 text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-30">
            <UiIcon name={icon} size={16} />
          </button>)}</div>
      </div>
      {renderItem(item, index)}
    </div>)}
    {items.length < max ? <button type="button" className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-accent"
      onClick={() => onChange({ action: "add", value: createItem(), id: crypto.randomUUID() })}>+ {addLabel}</button> : null}
  </div>;
}
