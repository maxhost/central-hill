"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  Field,
  FieldGrid,
  FormActions,
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { deleteFaqGroup, saveFaqGroup } from "../actions";
import type { FaqGroupEditData } from "../queries";

/**
 * FAQ group create/edit form (S12) — one client island for `/admin/faq/new` and
 * `/admin/faq/[id]`. The group (`key`, `position`) is edited together with its items
 * (each `question`/`answer`/`status`), which are added/removed/reordered inline and
 * posted as an array. Source [T] text is authored in English.
 */

type Status = "draft" | "published" | "archived";
const STATUSES: Status[] = ["draft", "published", "archived"];

interface ItemState {
  id?: string;
  status: Status;
  question: string;
  answer: string;
}

interface FormState {
  key: string;
  position: string;
  items: ItemState[];
}

function initialState(data: FaqGroupEditData | null): FormState {
  return {
    key: data?.key ?? "",
    position: String(data?.position ?? 0),
    items:
      data?.items.map((i) => ({
        id: i.id,
        status: i.status,
        question: i.question,
        answer: i.answer,
      })) ?? [],
  };
}

function buildPayload(s: FormState, id: string | undefined) {
  const intOr = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    id,
    key: s.key.trim(),
    position: intOr(s.position, 0),
    items: s.items.map((i) => ({
      id: i.id,
      status: i.status,
      question: i.question.trim(),
      answer: i.answer.trim(),
    })),
  };
}

export function FaqGroupForm({ initial }: { initial: FaqGroupEditData | null }) {
  const t = useTranslations("faq");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function updateItem(index: number, patch: Partial<ItemState>) {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }
  function addItem() {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, { status: "draft", question: "", answer: "" }],
    }));
  }
  function removeItem(index: number) {
    setState((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }
  function moveItem(index: number, dir: -1 | 1) {
    setState((prev) => {
      const next = [...prev.items];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...prev, items: next };
    });
  }

  function onSubmit() {
    setBanner(null);
    setErrors({});
    start(async () => {
      const result = await saveFaqGroup(buildPayload(state, initial?.id));
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/faq/${result.id}`);
          return;
        }
        setBanner(tb("actions.saved"));
        router.refresh();
        return;
      }
      if (result.error === "validation") {
        setErrors(result.fieldErrors);
        setBanner(tb("actions.saveError"));
      } else {
        setBanner(tb("actions.saveError"));
      }
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteFaqGroup(initial.id);
      if (result.ok) router.push("/admin/faq");
      else setBanner(tb("actions.saveError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.key || t("admin.editTitle") : t("admin.newTitle")}
        description={t("admin.formSubtitle")}
        actions={
          <Link href="/admin/faq" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.sections.group")}>
        <FieldGrid>
          <Field label={t("admin.fields.key")} required hint={t("admin.fields.keyHint")} error={err("key")}>
            <TextInput value={state.key} onChange={(e) => set("key", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.position")} hint={t("admin.fields.positionHint")}>
            <TextInput
              type="number"
              value={state.position}
              onChange={(e) => set("position", e.target.value)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.items")}>
        {state.items.length === 0 ? (
          <p className="text-sm text-ink-soft">{t("admin.noItems")}</p>
        ) : (
          <div className="space-y-5">
            {state.items.map((item, i) => (
              <div key={item.id ?? `new-${i}`} className="space-y-3 rounded-md border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    {t("admin.itemLabel", { n: i + 1 })}
                  </span>
                  <div className="flex items-center gap-1">
                    <AdminButton variant="ghost" onClick={() => moveItem(i, -1)} disabled={pending || i === 0}>
                      {tb("media.moveUp")}
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => moveItem(i, 1)}
                      disabled={pending || i === state.items.length - 1}
                    >
                      {tb("media.moveDown")}
                    </AdminButton>
                    <AdminButton variant="danger" onClick={() => removeItem(i)} disabled={pending}>
                      {tb("actions.delete")}
                    </AdminButton>
                  </div>
                </div>
                <Field label={t("admin.fields.itemStatus")}>
                  <Select
                    value={item.status}
                    onChange={(e) => updateItem(i, { status: e.target.value as Status })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`admin.status.${s}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("admin.fields.question")} required error={err(`items.${i}.question`)}>
                  <TextInput
                    value={item.question}
                    onChange={(e) => updateItem(i, { question: e.target.value })}
                  />
                </Field>
                <Field label={t("admin.fields.answer")} required error={err(`items.${i}.answer`)}>
                  <TextArea
                    rows={3}
                    value={item.answer}
                    onChange={(e) => updateItem(i, { answer: e.target.value })}
                  />
                </Field>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <AdminButton variant="ghost" onClick={addItem} disabled={pending}>
            {t("admin.addItem")}
          </AdminButton>
        </div>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton variant="ghost" onClick={() => router.push("/admin/faq")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
