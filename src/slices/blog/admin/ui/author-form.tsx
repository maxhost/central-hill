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
  type AdminMediaPreview,
  MediaField,
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { deleteAuthor, saveAuthor } from "../actions";
import type { AuthorEditData } from "../queries";

/** Author create/edit form (S12). The [T] `name`/`bio` are authored in English. */

type Status = "draft" | "published" | "archived";
const STATUSES: Status[] = ["draft", "published", "archived"];

interface FormState {
  slug: string;
  status: Status;
  avatar_media_id: string;
  name: string;
  bio: string;
}

function initialState(data: AuthorEditData | null): FormState {
  return {
    slug: data?.slug ?? "",
    status: data?.status ?? "draft",
    avatar_media_id: data?.avatar_media_id ?? "",
    name: data?.name ?? "",
    bio: data?.bio ?? "",
  };
}

function buildPayload(s: FormState, id: string | undefined) {
  const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
  return {
    id,
    slug: s.slug.trim(),
    status: s.status,
    avatar_media_id: s.avatar_media_id || null,
    name: s.name.trim(),
    bio: orNull(s.bio),
  };
}

export function AuthorForm({
  initial,
  previews,
}: {
  initial: AuthorEditData | null;
  previews: Record<string, AdminMediaPreview>;
}) {
  const t = useTranslations("blog");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function onSubmit() {
    setBanner(null);
    setErrors({});
    start(async () => {
      const result = await saveAuthor(buildPayload(state, initial?.id));
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/authors/${result.id}`);
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
      const result = await deleteAuthor(initial.id);
      if (result.ok) {
        router.push("/admin/authors");
        return;
      }
      setBanner(result.error === "in_use" ? t("admin.author.inUse") : tb("actions.saveError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.name || t("admin.author.editTitle") : t("admin.author.newTitle")}
        description={t("admin.author.formSubtitle")}
        actions={
          <Link href="/admin/authors" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.author.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.author.sections.details")}>
        <div className="space-y-4">
          <Field label={t("admin.author.fields.name")} required error={err("name")}>
            <TextInput value={state.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <FieldGrid>
            <Field label={t("admin.author.fields.slug")} required error={err("slug")}>
              <TextInput value={state.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
            <Field label={t("admin.author.fields.status")}>
              <Select value={state.status} onChange={(e) => set("status", e.target.value as Status)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`admin.status.${s}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGrid>
          <Field label={t("admin.author.fields.bio")} error={err("bio")}>
            <TextArea rows={4} value={state.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.author.sections.avatar")}>
        <Field label={t("admin.author.fields.avatar")}>
          <MediaField
            value={state.avatar_media_id || null}
            preview={previews[state.avatar_media_id] ?? null}
            onChange={(id) => set("avatar_media_id", id ?? "")}
          />
        </Field>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton variant="ghost" onClick={() => router.push("/admin/authors")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
