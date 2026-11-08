"use server";
import { resolveMediaAlt } from "@core/media/alt";
import { createElement, Fragment, type ReactNode } from "react";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireStaff } from "@core/auth";
import { loadMedia, mediaUrl } from "@core/media";
import { bodyBlock } from "../body";
import { checkBlogEnvelope } from "../server/post-locale-validation";
import { resolvePostDocument } from "../server/queries";
import { BlogPostRenderer } from "../ui/blog-post";

const requestSchema = z.object({
  postId: z.uuid(), locale: z.enum(["en", "es", "pt", "fr"]), slug: z.string().max(120),
  envelope: z.unknown(),
  localMedia: z.record(z.uuid(), z.object({ id: z.uuid(), url: z.string().max(512), mime: z.string().max(100), width: z.number().positive().nullable(), height: z.number().positive().nullable(), name: z.string().max(120).optional() })),
});
export async function renderPostLivePreview(raw: unknown): Promise<{ ok: true; content: ReactNode } | { ok: false; error: "validation" | "server" }> {
  await requireStaff();
  try { if (new TextEncoder().encode(JSON.stringify(raw)).byteLength > 256 * 1024) return { ok: false, error: "validation" }; } catch { return { ok: false, error: "validation" }; }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success || Object.keys(parsed.data.localMedia).length > 202) return { ok: false, error: "validation" };
  const { postId, locale, slug, localMedia } = parsed.data;
  const checked = checkBlogEnvelope(parsed.data.envelope);
  if (!checked.envelope || Object.keys(checked.errors).length) return { ok: false, error: "validation" };
  try {
    const requestHeaders = await headers();
    const origin = requestHeaders.get("origin") ?? new URL(requestHeaders.get("referer") ?? `http://${requestHeaders.get("host")}`).origin;
    for (const [id, asset] of Object.entries(localMedia)) {
      if (id !== asset.id || !asset.mime.startsWith("image/")) return { ok: false, error: "validation" };
      const url = new URL(asset.url);
      if (url.protocol !== "blob:" || url.origin !== origin) return { ok: false, error: "validation" };
    }
    const envelope = checked.envelope;
    const publishErrors = checkBlogEnvelope(envelope, true).errors;
    const validBody = envelope.content.body.filter(block => bodyBlock.safeParse(block).success);
    const previewEnvelope = { ...envelope, content: { ...envelope.content, body: validBody } };
    const post = await resolvePostDocument(postId, previewEnvelope, locale, slug);
    if (!post) return { ok: false, error: "validation" };
    // Persisted media wins. Only temporary same-origin blobs may fill absent assets.
    const persisted = await loadMedia(Object.keys(localMedia));
    for (const [id, asset] of Object.entries(localMedia)) {
      const stored = persisted.get(id);
      post.bodyMedia[id] = stored
        ? { url: mediaUrl(stored.r2_key), width: stored.width ?? 1600, height: stored.height ?? 1200, alt: resolveMediaAlt(envelope.content.media_alts, id, post.bodyMedia[id]?.alt ?? ""), blurhash: stored.blurhash }
        : { url: asset.url, width: asset.width ?? 1600, height: asset.height ?? 1200, alt: resolveMediaAlt(envelope.content.media_alts, id, post.bodyMedia[id]?.alt ?? ""), blurhash: null };
      if (id === envelope.content.cover_media_id) post.cover = post.bodyMedia[id]!;
      if (id === envelope.content.og_image_media_id) post.ogImage = post.bodyMedia[id]!;
    }
    const content = await BlogPostRenderer({ locale, post, preview: true, ...{ editorBindings: true } });
    const t = await getTranslations({ locale, namespace: "blog" });
    const incomplete = Object.keys(publishErrors).length > 0 || validBody.length !== envelope.content.body.length;
    return { ok: true, content: createElement(Fragment, null,
      incomplete ? createElement("p", { role: "status", className: "border-b border-line bg-surface px-7 py-3 text-sm text-ink-soft" }, t("editorial.previewIncomplete")) : null,
      content) };
  } catch (error) {
    console.error("Blog preview failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: "server" };
  }
}
