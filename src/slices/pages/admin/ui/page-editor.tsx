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
  FormActions,
  type AdminMediaPreview,
  MediaField,
  Select,
} from "@slices/backoffice/contract";
import { savePage } from "../actions";
import { type FieldNode, humanizeKey } from "../form-model";
import { NodeField, type PathOnChange } from "./schema-fields";

/**
 * Page content editor (S12, ADR 0012). One client island per fixed page
 * (`/admin/pages/[key]`). The `FieldNode` tree + scaffolded `data` are computed on
 * the server (Zod stays out of the client bundle) and edited here against a nested
 * `data` object updated immutably by path. Status + the social-share image sit
 * outside `data` (own columns). Saves post through `savePage`.
 */

type Status = "draft" | "published";

/** Immutable nested set by path (string keys = object, number = array index). */
function setIn(target: unknown, path: (string | number)[], value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (typeof head === "number") {
    const arr = Array.isArray(target) ? [...target] : [];
    arr[head] = setIn(arr[head], rest, value);
    return arr;
  }
  const obj = target && typeof target === "object" ? { ...(target as Record<string, unknown>) } : {};
  obj[head as string] = setIn(obj[head as string], rest, value);
  return obj;
}

export function PageEditor({
  pageKey,
  rootNode,
  initialData,
  initialStatus,
  initialOgImageMediaId,
  previews,
}: {
  pageKey: string;
  rootNode: FieldNode;
  initialData: Record<string, unknown>;
  initialStatus: Status;
  initialOgImageMediaId: string | null;
  previews: Record<string, AdminMediaPreview>;
}) {
  const t = useTranslations("pages");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [ogImage, setOgImage] = useState<string>(initialOgImageMediaId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const onChange: PathOnChange = (path, value) => {
    setData((prev) => setIn(prev, path, value) as Record<string, unknown>);
  };

  const topFields = rootNode.kind === "object" ? rootNode.fields : [];
  const pageName = t.has(`admin.pages.${pageKey}`) ? t(`admin.pages.${pageKey}`) : humanizeKey(pageKey);

  function onSubmit() {
    setBanner(null);
    setErrors({});
    start(async () => {
      const result = await savePage(pageKey, {
        status,
        data,
        og_image_media_id: ogImage || null,
      });
      if (result.ok) {
        setBanner(tb("actions.saved"));
        router.refresh();
        return;
      }
      if (result.error === "validation") {
        setErrors(result.fieldErrors);
        setBanner(t("admin.validationError"));
      } else {
        setBanner(tb("actions.saveError"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pageName}
        description={t("admin.formSubtitle")}
        actions={
          <Link href="/admin/pages" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.sections.publish")}>
        <div className="space-y-4">
          <Field label={t("admin.fields.status")} error={errors.status}>
            <Select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              <option value="draft">{t("admin.status.draft")}</option>
              <option value="published">{t("admin.status.published")}</option>
            </Select>
          </Field>
          <Field label={t("admin.fields.ogImage")} hint={t("admin.fields.ogImageHint")}>
            <MediaField
              value={ogImage || null}
              preview={ogImage ? (previews[ogImage] ?? null) : null}
              onChange={(id) => setOgImage(id ?? "")}
            />
          </Field>
        </div>
      </AdminCard>

      {topFields.map((f) => (
        <AdminCard key={f.key} title={humanizeKey(f.key)}>
          <NodeField
            node={f.node}
            value={data[f.key]}
            path={[f.key]}
            label={humanizeKey(f.key)}
            depth={0}
            onChange={onChange}
            errors={errors}
            previews={previews}
          />
        </AdminCard>
      ))}

      <FormActions>
        <AdminButton variant="ghost" onClick={() => router.push("/admin/pages")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
