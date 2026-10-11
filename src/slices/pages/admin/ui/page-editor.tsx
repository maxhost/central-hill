"use client";

import { useRef, useState, useTransition } from "react";
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
  useMediaQueue,
} from "@slices/backoffice/contract";
import { savePage } from "../actions";
import { type FieldNode, type SelectOptions, humanizeKey } from "../form-model";
import { type EditorNote, resolveEditorLayout } from "../layout";
import { NodeField, type PathOnChange, useFieldLabels } from "./schema-fields";

/**
 * Page content editor (S12, ADR 0012). One client island per fixed page
 * (`/admin/pages/[key]`). The `FieldNode` tree + scaffolded `data` are computed on
 * the server (Zod stays out of the client bundle) and edited here against a nested
 * `data` object updated immutably by path. Pages have no draft/published state — a
 * saved page is live; only the social-share image sits outside `data` (own column).
 * Saves post through `savePage`.
 *
 * A page with an editor layout (`../layout.ts`, today only `home`) renders its cards in
 * page order with read-only notes; every other page keeps one card per root key. Save is
 * disabled while a picked file is still being reserved (`queue.isPreparing`) or while the
 * upload flush / save runs.
 */

/** Small muted line under a card title (+ optional link to the admin screen it names). */
function CardNote({ note }: { note: EditorNote }) {
  const t = useTranslations("pages");
  return (
    <p className="-mt-1 mb-4 text-xs text-ink-soft">
      {t(note.textKey)}
      {note.link ? (
        <>
          {" "}
          <Link href={note.link.href} className="font-medium text-ink underline-offset-2 hover:underline">
            {t(note.link.labelKey)} →
          </Link>
        </>
      ) : null}
    </p>
  );
}

/** Immutable nested set by path (string keys = object, number = array index). */
function setIn(
  target: unknown,
  path: (string | number)[],
  value: unknown,
): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (typeof head === "number") {
    const arr = Array.isArray(target) ? [...target] : [];
    arr[head] = setIn(arr[head], rest, value);
    return arr;
  }
  const obj =
    target && typeof target === "object"
      ? { ...(target as Record<string, unknown>) }
      : {};
  obj[head as string] = setIn(obj[head as string], rest, value);
  return obj;
}

export function PageEditor({
  pageKey,
  rootNode,
  initialData,
  initialOgImageMediaId,
  previews,
  options,
}: {
  pageKey: string;
  rootNode: FieldNode;
  initialData: Record<string, unknown>;
  initialOgImageMediaId: string | null;
  previews: Record<string, AdminMediaPreview>;
  options: SelectOptions;
}) {
  const t = useTranslations("pages");
  const tb = useTranslations("backoffice");
  const labels = useFieldLabels();
  const router = useRouter();
  const [pending, start] = useTransition();
  const queue = useMediaQueue();
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [ogImage, setOgImage] = useState<string>(initialOgImageMediaId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  // Covers the upload flush (which runs outside the transition) up to the hand-off to
  // `start`; `pending` covers the save itself. The ref blocks a double submit that
  // lands before React re-renders the disabled button.
  const [flushing, setFlushing] = useState(false);
  const submittingRef = useRef(false);
  const preparing = queue.isPreparing;
  const busy = pending || flushing || preparing;

  const onChange: PathOnChange = (path, value) => {
    setData((prev) => setIn(prev, path, value) as Record<string, unknown>);
  };

  const topFields = rootNode.kind === "object" ? rootNode.fields : [];
  const pageName = t.has(`admin.pages.${pageKey}`)
    ? t(`admin.pages.${pageKey}`)
    : humanizeKey(pageKey);

  const layout = resolveEditorLayout(
    pageKey,
    topFields.map((f) => f.key),
  );

  function onSubmit() {
    // Guard the handler too, not just the button: a save while a pick is still being
    // reserved would persist the page without the file just picked.
    if (busy || submittingRef.current) return;
    submittingRef.current = true;
    setBanner(null);
    setErrors({});
    setFlushing(true);
    void (async () => {
      // Uploads run OUTSIDE the transition on purpose: `startTransition` marks every
      // update in its scope as low priority, so the queue's progress modal would not
      // paint until the transition it lives in had already finished (ADR 0030).
      let flushed = false;
      try {
        flushed = await queue.flush();
      } finally {
        setFlushing(false);
        if (!flushed) submittingRef.current = false;
      }
      if (!flushed) return;
      start(async () => {
        const result = await savePage(pageKey, {
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
      submittingRef.current = false;
    })();
  }

  const ogImageField = (
    <Field label={t("admin.fields.ogImage")} hint={t("admin.fields.ogImageHint")}>
      <MediaField
        value={ogImage || null}
        preview={ogImage ? (previews[ogImage] ?? null) : null}
        onChange={(id) => setOgImage(id ?? "")}
      />
    </Field>
  );

  const renderField = (key: string, label: string) => {
    const f = topFields.find((x) => x.key === key);
    if (!f) return null;
    return (
      <NodeField
        key={f.key}
        node={f.node}
        value={data[f.key]}
        path={[f.key]}
        label={label}
        depth={0}
        onChange={onChange}
        errors={errors}
        previews={previews}
        options={options}
      />
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pageName}
        description={t("admin.formSubtitle")}
        actions={
          <Link
            href="/admin/pages"
            className="text-sm text-ink-soft hover:text-ink"
          >
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">
          {banner}
        </p>
      ) : null}

      {layout ? (
        layout.map((item) => (
          <AdminCard key={item.id} title={t(item.titleKey)}>
            {item.note ? <CardNote note={item.note} /> : null}
            {item.kind === "card" ? (
              <div className="space-y-4">
                {item.paths.map((p) => renderField(p, labels.field(p)))}
                {item.hostsOgImage ? ogImageField : null}
              </div>
            ) : null}
          </AdminCard>
        ))
      ) : (
        <>
          <AdminCard title={t("admin.sections.social")}>{ogImageField}</AdminCard>
          {topFields.map((f) => (
            <AdminCard key={f.key} title={labels.field(f.key)}>
              {renderField(f.key, labels.field(f.key))}
            </AdminCard>
          ))}
        </>
      )}

      <FormActions>
        {preparing ? (
          <p role="status" className="text-xs text-ink-soft">
            {tb("media.waitForMedia")}
          </p>
        ) : null}
        <AdminButton
          variant="ghost"
          onClick={() => router.push("/admin/pages")}
          disabled={pending || flushing}
        >
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={busy}>
          {pending || flushing ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
