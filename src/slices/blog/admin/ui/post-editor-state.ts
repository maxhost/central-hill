import type { Locale } from "@core/db/columns";
import type { BlogPostContent, BlogPostEnvelopeV1, BlogPostLocaleModel } from "../editorial-contract";

export const POST_EDITOR_BINDING_IDS = ["article", "header", "body", "cta", "related", "seo"];
export const POST_SHARED_FIELDS = ["category_id", "author_id", "cover_media_id", "og_image_media_id", "published_at", "is_featured", "related_ids"] as const;

export function emptyPostEnvelope(categoryId = "", authorId = ""): BlogPostEnvelopeV1 {
  return { schemaVersion: 1, content: {
    title: "", excerpt: "", body: [], category_id: categoryId, author_id: authorId,
    cover_media_id: null, og_image_media_id: null, published_at: null,
    reading_minutes: 5, is_featured: false, related_ids: [], cta_label: null,
    cta_url: null, meta_title: null, meta_description: null,
  } };
}

/** Only shared references come from EN; a target body is never merged by index. */
export function preparePostTarget(source: BlogPostEnvelopeV1, own: BlogPostEnvelopeV1 | null): BlogPostEnvelopeV1 {
  if (!own) return structuredClone(source);
  const content = { ...own.content };
  for (const key of POST_SHARED_FIELDS) {
    Object.assign(content, { [key]: structuredClone(source.content[key]) });
  }
  return { schemaVersion: 1, content };
}

export function postEnvelopeEqual(a: BlogPostEnvelopeV1 | null, b: BlogPostEnvelopeV1 | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function postLocaleDirty(model: BlogPostLocaleModel): boolean {
  return !postEnvelopeEqual(model.working, model.draft ?? model.published);
}

export function postMediaIds(envelope: BlogPostEnvelopeV1): string[] {
  const content = envelope.content;
  return [...new Set([content.cover_media_id, content.og_image_media_id,
    ...content.body.flatMap(block => block.type === "image" ? [block.media_id] : []),
  ].filter((id): id is string => Boolean(id)))];
}

export interface PostLocaleWorkspace {
  model: BlogPostLocaleModel;
  errors: Record<string, string>;
  notice: string;
  conflict: boolean;
}
export type PostWorkspace = Record<Locale, PostLocaleWorkspace>;

/** Saved EN changes refresh only derived shared fields, retaining local target copy. */
export function applyPostLocaleResult(states: PostWorkspace, locale: Locale, model: BlogPostLocaleModel, notice: string): PostWorkspace {
  const next = { ...states, [locale]: { model, errors: {}, notice, conflict: false } };
  if (locale !== "en") return next;
  const template = model.draft ?? model.published ?? model.working;
  for (const target of ["es", "pt", "fr"] as const) {
    const own = states[target];
    // A persisted target draft owns its complete document and source provenance.
    if (own.model.draft) continue;
    next[target] = { ...own, model: { ...own.model,
      templateRevision: model.revision,
      working: preparePostTarget(template, own.model.working),
    } };
  }
  return next;
}

export function changePostField<K extends keyof BlogPostContent>(states: PostWorkspace, locale: Locale, key: K, value: BlogPostContent[K]): PostWorkspace {
  const own = states[locale];
  return { ...states, [locale]: { ...own, notice: "", model: { ...own.model,
    working: { ...own.model.working, content: { ...own.model.working.content, [key]: value } },
  } } };
}
