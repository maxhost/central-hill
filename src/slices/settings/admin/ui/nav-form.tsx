"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  Field,
  FieldGrid,
  FormActions,
  TextInput,
} from "@slices/backoffice/contract";
import { saveNavigation } from "../actions";
import type { NavLinkEdit, NavParentEdit, NavigationEditData } from "../queries";

/**
 * Navigation builder (S12) — the header + footer trees (one level of children). Posts
 * through `saveNavigation`; nav items are upserted by id (label translations preserved)
 * and removed items purged. The [T] `label` is authored in English.
 */

type Loc = "header" | "footer";
const LOCATIONS: Loc[] = ["header", "footer"];

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const next = [...arr];
  const target = i + dir;
  if (target < 0 || target >= next.length) return arr;
  [next[i], next[target]] = [next[target]!, next[i]!];
  return next;
}

export function NavForm({ initial }: { initial: NavigationEditData }) {
  const t = useTranslations("settings");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<NavigationEditData>(initial);
  const [banner, setBanner] = useState<string | null>(null);

  const setLoc = (loc: Loc, items: NavParentEdit[]) =>
    setState((prev) => ({ ...prev, [loc]: items }));

  function onSubmit() {
    setBanner(null);
    const clean = (l: NavLinkEdit) => ({ id: l.id, url: l.url.trim(), label: l.label.trim() });
    const payload = {
      header: state.header.map((p) => ({ ...clean(p), children: p.children.map(clean) })),
      footer: state.footer.map((p) => ({ ...clean(p), children: p.children.map(clean) })),
    };
    start(async () => {
      const result = await saveNavigation(payload);
      setBanner(result.ok ? tb("actions.saved") : tb("actions.saveError"));
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.nav.title")} description={t("admin.nav.subtitle")} />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      {LOCATIONS.map((loc) => (
        <LocationEditor
          key={loc}
          title={t(`admin.nav.locations.${loc}`)}
          items={state[loc]}
          pending={pending}
          onChange={(items) => setLoc(loc, items)}
        />
      ))}

      <FormActions>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}

function LocationEditor({
  title,
  items,
  pending,
  onChange,
}: {
  title: string;
  items: NavParentEdit[];
  pending: boolean;
  onChange: (items: NavParentEdit[]) => void;
}) {
  const t = useTranslations("settings");
  const tb = useTranslations("backoffice");

  const updateItem = (i: number, patch: Partial<NavParentEdit>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => onChange([...items, { url: "", label: "", children: [] }]);
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const updateChild = (i: number, j: number, patch: Partial<NavLinkEdit>) =>
    onChange(
      items.map((it, idx) =>
        idx === i
          ? { ...it, children: it.children.map((c, cj) => (cj === j ? { ...c, ...patch } : c)) }
          : it,
      ),
    );
  const addChild = (i: number) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, children: [...it.children, { url: "", label: "" }] } : it)));
  const removeChild = (i: number, j: number) =>
    onChange(
      items.map((it, idx) =>
        idx === i ? { ...it, children: it.children.filter((_, cj) => cj !== j) } : it,
      ),
    );

  return (
    <AdminCard title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">{t("admin.nav.noItems")}</p>
      ) : (
        <div className="space-y-5">
          {items.map((item, i) => (
            <div key={item.id ?? `new-${i}`} className="space-y-3 rounded-md border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {t("admin.nav.itemLabel", { n: i + 1 })}
                </span>
                <div className="flex items-center gap-1">
                  <AdminButton variant="ghost" onClick={() => onChange(move(items, i, -1))} disabled={pending || i === 0}>
                    {tb("media.moveUp")}
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    onClick={() => onChange(move(items, i, 1))}
                    disabled={pending || i === items.length - 1}
                  >
                    {tb("media.moveDown")}
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => removeItem(i)} disabled={pending}>
                    {tb("actions.delete")}
                  </AdminButton>
                </div>
              </div>
              <FieldGrid>
                <Field label={t("admin.nav.fields.label")}>
                  <TextInput value={item.label} onChange={(e) => updateItem(i, { label: e.target.value })} />
                </Field>
                <Field label={t("admin.nav.fields.url")}>
                  <TextInput value={item.url} onChange={(e) => updateItem(i, { url: e.target.value })} />
                </Field>
              </FieldGrid>

              <div className="space-y-2 border-l-2 border-line pl-4">
                <span className="text-xs font-medium text-ink-soft">{t("admin.nav.children")}</span>
                {item.children.map((child, j) => (
                  <div key={child.id ?? `new-${j}`} className="flex flex-wrap items-end gap-2">
                    <Field label={t("admin.nav.fields.label")} className="flex-1">
                      <TextInput value={child.label} onChange={(e) => updateChild(i, j, { label: e.target.value })} />
                    </Field>
                    <Field label={t("admin.nav.fields.url")} className="flex-1">
                      <TextInput value={child.url} onChange={(e) => updateChild(i, j, { url: e.target.value })} />
                    </Field>
                    <AdminButton variant="danger" onClick={() => removeChild(i, j)} disabled={pending}>
                      ✕
                    </AdminButton>
                  </div>
                ))}
                <AdminButton variant="ghost" onClick={() => addChild(i)} disabled={pending}>
                  {t("admin.nav.addChild")}
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4">
        <AdminButton variant="ghost" onClick={addItem} disabled={pending}>
          {t("admin.nav.addItem")}
        </AdminButton>
      </div>
    </AdminCard>
  );
}
