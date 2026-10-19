"use server";
import { requireStaff } from "@core/auth";
import { env } from "@core/env";
import type { PageLivePreviewResult } from "@slices/backoffice/contract";
import type { Locale } from "@core/db/columns";
import type { EditorialPageKey } from "../editorial-types";
import { getEditorialAdapter } from "../server/editorial-adapters";
import { validEditorialRequest, validEditorialSurface } from "../server/editorial-policy";
import { resolveMedia } from "../server/resolve";
import { validatePageLivePreview } from "./live-preview-validation";

/** Ephemeral RSC rendering only: no mutation, upload or revalidation. */
export async function renderPageLivePreview<K extends EditorialPageKey>(
  key: K,
  locale: string,
  payload: unknown,
  surface: string = "page",
): Promise<PageLivePreviewResult> {
  await requireStaff();
  if (!validEditorialRequest(key, locale) || !validEditorialSurface(key, surface))
    return { ok: false, error: "validation" };
  const checked = validatePageLivePreview(key, payload, env.BETTER_AUTH_URL);
  if (!checked) return { ok: false, error: "validation" };
  try {
    const { envelope, localMedia } = checked;
    const adapter = getEditorialAdapter(key);
    const resolved = await resolveMedia(
      envelope.content,
      envelope.ogImageMediaId,
      locale as Locale,
    );
    // A completed upload wins over the earlier raw local preview for its ID.
    for (const [id, local] of Object.entries(localMedia))
      if (!resolved.media[id])
        resolved.media[id] = {
          url: local.url,
          width: local.width ?? 1200,
          height: local.height ?? 1500,
          mime: local.mime,
          alt: "",
          blurhash: null,
        };
    if (
      Object.keys(
        adapter.mediaErrors(
          envelope.content,
          envelope.ogImageMediaId,
          new Map(
            Object.entries(resolved.media).map(([id, media]) => [
              id,
              { mime: media.mime ?? "" },
            ]),
          ),
        ),
      ).length
    )
      return { ok: false, error: "validation" };
    resolved.ogImage = envelope.ogImageMediaId
      ? (resolved.media[envelope.ogImageMediaId] ?? null)
      : null;
    const content = await adapter.render({
      locale: locale as Locale,
      preview: true,
      surface,
      page: { content: envelope.content, ...resolved },
    });
    return { ok: true, content };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function renderHomeLivePreview(
  locale: string,
  payload: unknown,
): Promise<PageLivePreviewResult> {
  return renderPageLivePreview("home", locale, payload);
}
