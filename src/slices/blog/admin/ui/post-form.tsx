"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  Checkbox,
  Field,
  FieldGrid,
  FormActions,
  type AdminMediaPreview,
  MediaField,
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { deletePost, savePost } from "../actions";
import type { PostEditData } from "../queries";
import type { PostBody } from "../../body";
import { BodyEditor } from "./body-editor";

/**
 * Blog-post create/edit form (S12) — one client island for `/admin/posts/new` and
 * `/admin/posts/[id]`. Posts through `savePost`; category/author/related selectors are
 * fed from this slice's admin queries. The portable-JSON `body` is edited by
 * {@link BodyEditor}; source [T] text is authored in English.
 */

type Status = "draft" | "published" | "archived";
const STATUSES: Status[] = ["draft", "published", "archived"];
const MAX_RELATED = 3;

interface FormState {
  slug: string;
  status: Status;
  category_id: string;
  author_id: string;
  cover_media_id: string;
  og_image_media_id: string;
  published_at: string;
  reading_minutes: string;
  is_featured: boolean;
  cta_label: string;
  cta_url: string;
  title: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
}

function toLocalInput(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

function initialState(data: PostEditData | null, catId: string, authorId: string): FormState {
  return {
    slug: data?.slug ?? "",
    status: data?.status ?? "draft",
    category_id: data?.category_id ?? catId,
    author_id: data?.author_id ?? authorId,
    cover_media_id: data?.cover_media_id ?? "",
    og_image_media_id: data?.og_image_media_id ?? "",
    published_at: toLocalInput(data?.published_at ?? null),
    reading_minutes: String(data?.reading_minutes ?? 5),
    is_featured: data?.is_featured ?? false,
    cta_label: data?.cta_label ?? "",
    cta_url: data?.cta_url ?? "",
    title: data?.title ?? "",
    excerpt: data?.excerpt ?? "",
    meta_title: data?.meta_title ?? "",
    meta_description: data?.meta_description ?? "",
  };
}

export function PostForm({
  initial,
  previews: initialPreviews,
  categories,
  authors,
  posts,
}: {
  initial: PostEditData | null;
  previews: Record<string, AdminMediaPreview>;
  categories: { id: string; name: string }[];
  authors: { id: string; name: string }[];
  posts: { id: string; title: string }[];
}) {
  const t = useTranslations("blog");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(() =>
    initialState(initial, categories[0]?.id ?? "", authors[0]?.id ?? ""),
  );
  const [body, setBody] = useState<PostBody>(() => initial?.body ?? []);
  const [relatedIds, setRelatedIds] = useState<string[]>(() => initial?.related_ids ?? []);
  const [previews, setPreviews] = useState<Record<string, AdminMediaPreview>>(initialPreviews);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  const registerPreview = (preview: AdminMediaPreview | null) => {
    if (preview) setPreviews((prev) => ({ ...prev, [preview.id]: preview }));
  };

  function toggleRelated(id: string) {
    setRelatedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_RELATED) return prev;
      return [...prev, id];
    });
  }

  function buildPayload() {
    const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
    const intOr = (v: string, fallback: number) => {
      const n = Number.parseInt(v, 10);
      return Number.isFinite(n) ? n : fallback;
    };
    return {
      id: initial?.id,
      slug: state.slug.trim(),
      status: state.status,
      category_id: state.category_id,
      author_id: state.author_id,
      cover_media_id: state.cover_media_id || null,
      og_image_media_id: orNull(state.og_image_media_id),
      published_at: state.published_at.trim() === "" ? null : state.published_at,
      reading_minutes: intOr(state.reading_minutes, 1),
      is_featured: state.is_featured,
      cta_label: orNull(state.cta_label),
      cta_url: orNull(state.cta_url),
      title: state.title.trim(),
      excerpt: state.excerpt.trim(),
      body,
      meta_title: orNull(state.meta_title),
      meta_description: orNull(state.meta_description),
      related_ids: relatedIds,
    };
  }

  function onSubmit() {
    setBanner(null);
    if (!state.cover_media_id) {
      setErrors({ cover_media_id: t("admin.post.errors.coverRequired") });
      return;
    }
    setErrors({});
    start(async () => {
      const result = await savePost(buildPayload());
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/posts/${result.id}`);
          return;
        }
        setBanner(tb("actions.saved"));
        router.refresh();
        return;
      }
      if (result.error === "validation") {
        setErrors(result.fieldErrors);
        setBanner(tb("actions.saveError"));
      } else if (result.error === "slug_conflict") {
        setErrors({ slug: t("admin.post.errors.slugConflict") });
      } else {
        setBanner(tb("actions.saveError"));
      }
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deletePost(initial.id);
      if (result.ok) router.push("/admin/posts");
      else setBanner(tb("actions.saveError"));
    });
  }

  const relatable = posts.filter((p) => p.id !== initial?.id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.title || t("admin.post.editTitle") : t("admin.post.newTitle")}
        description={t("admin.post.formSubtitle")}
        actions={
          <Link href="/admin/posts" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.post.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.post.sections.status")}>
        <FieldGrid>
          <Field label={t("admin.post.fields.status")}>
            <Select value={state.status} onChange={(e) => set("status", e.target.value as Status)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`admin.status.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.post.fields.publishedAt")} hint={t("admin.post.fields.publishedAtHint")}>
            <TextInput
              type="datetime-local"
              value={state.published_at}
              onChange={(e) => set("published_at", e.target.value)}
            />
          </Field>
          <Field label={t("admin.post.fields.readingMinutes")} error={err("reading_minutes")}>
            <TextInput
              type="number"
              value={state.reading_minutes}
              onChange={(e) => set("reading_minutes", e.target.value)}
            />
          </Field>
          <Field label={t("admin.post.fields.featured")}>
            <Checkbox
              label={t("admin.post.fields.featuredLabel")}
              checked={state.is_featured}
              onChange={(e) => set("is_featured", e.target.checked)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.post.sections.identity")}>
        <div className="space-y-4">
          <FieldGrid>
            <Field label={t("admin.post.fields.category")} required error={err("category_id")}>
              <Select value={state.category_id} onChange={(e) => set("category_id", e.target.value)}>
                <option value="">{t("admin.post.fields.choose")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("admin.post.fields.author")} required error={err("author_id")}>
              <Select value={state.author_id} onChange={(e) => set("author_id", e.target.value)}>
                <option value="">{t("admin.post.fields.choose")}</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGrid>
          <Field label={t("admin.post.fields.title")} required error={err("title")}>
            <TextInput value={state.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label={t("admin.post.fields.slug")} required hint={t("admin.post.fields.slugHint")} error={err("slug")}>
            <TextInput value={state.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label={t("admin.post.fields.excerpt")} required error={err("excerpt")}>
            <TextArea value={state.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.post.sections.media")}>
        <div className="space-y-5">
          <Field label={t("admin.post.fields.cover")} required error={err("cover_media_id")}>
            <MediaField
              value={state.cover_media_id || null}
              preview={previews[state.cover_media_id] ?? null}
              onChange={(id, preview) => {
                set("cover_media_id", id ?? "");
                registerPreview(preview);
              }}
            />
          </Field>
          <Field label={t("admin.post.fields.ogImage")} hint={t("admin.post.fields.ogImageHint")}>
            <MediaField
              value={state.og_image_media_id || null}
              preview={previews[state.og_image_media_id] ?? null}
              onChange={(id, preview) => {
                set("og_image_media_id", id ?? "");
                registerPreview(preview);
              }}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.post.sections.body")}>
        <BodyEditor value={body} onChange={setBody} previews={previews} onPreview={registerPreview} />
      </AdminCard>

      <AdminCard title={t("admin.post.sections.cta")}>
        <FieldGrid>
          <Field label={t("admin.post.fields.ctaLabel")} error={err("cta_label")}>
            <TextInput value={state.cta_label} onChange={(e) => set("cta_label", e.target.value)} />
          </Field>
          <Field label={t("admin.post.fields.ctaUrl")} error={err("cta_url")}>
            <TextInput value={state.cta_url} onChange={(e) => set("cta_url", e.target.value)} />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.post.sections.related")}>
        {relatable.length === 0 ? (
          <p className="text-sm text-ink-soft">{t("admin.post.related.empty")}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-ink-soft">{t("admin.post.related.hint", { max: MAX_RELATED })}</p>
            {relatable.map((p) => {
              const checked = relatedIds.includes(p.id);
              return (
                <Checkbox
                  key={p.id}
                  label={p.title}
                  checked={checked}
                  disabled={!checked && relatedIds.length >= MAX_RELATED}
                  onChange={() => toggleRelated(p.id)}
                />
              );
            })}
          </div>
        )}
      </AdminCard>

      <AdminCard title={t("admin.post.sections.seo")}>
        <div className="space-y-4">
          <Field label={t("admin.post.fields.metaTitle")} error={err("meta_title")}>
            <TextInput value={state.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
          </Field>
          <Field label={t("admin.post.fields.metaDescription")} error={err("meta_description")}>
            <TextArea
              value={state.meta_description}
              onChange={(e) => set("meta_description", e.target.value)}
            />
          </Field>
        </div>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton variant="ghost" onClick={() => router.push("/admin/posts")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
