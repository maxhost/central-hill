import { z } from "zod";
import {
  IMAGE_MIMES,
  VIDEO_MIMES,
  LOTTIE_MIMES,
  DOCUMENT_MIMES,
} from "@core/media/mime";
import type {
  EditorialPageKey,
  PageLivePreviewInput,
} from "../editorial-types";
import { validateEnvelope } from "./editorial-validation";
import { getEditorialAdapter } from "../server/editorial-adapters";

const localPreview = z
  .object({
    id: z.uuid(),
    url: z.string().max(2048),
    width: z.number().int().positive().max(20000).nullable(),
    height: z.number().int().positive().max(20000).nullable(),
    mime: z.enum([
      ...IMAGE_MIMES,
      ...VIDEO_MIMES,
      ...LOTTIE_MIMES,
      ...DOCUMENT_MIMES,
    ]),
    name: z.string().max(255).optional(),
  })
  .strict();
const request = z
  .object({
    envelope: z.unknown(),
    localMedia: z.record(z.uuid(), localPreview),
  })
  .strict();

/** Only in-memory, same-origin blob references are accepted by this read path. */
export function validatePageLivePreview<K extends EditorialPageKey>(
  key: K,
  raw: unknown,
  trustedOrigin: string | undefined,
): PageLivePreviewInput<K> | null {
  try {
    if (JSON.stringify(raw).length > 256 * 1024) return null;
    const parsed = request.safeParse(raw);
    if (!parsed.success) return null;
    const adapter = getEditorialAdapter(key);
    if (
      Object.keys(parsed.data.localMedia).length >
      adapter.descriptor.maxLocalMedia
    )
      return null;
    const checked = validateEnvelope(parsed.data.envelope, false, key);
    if (!checked.payload || Object.keys(checked.errors).length) return null;
    const references = new Set(
      adapter
        .collectMediaReferences(
          checked.payload.content,
          checked.payload.ogImageMediaId,
        )
        .map((ref) => ref.id),
    );
    for (const [id, media] of Object.entries(parsed.data.localMedia)) {
      if (!references.has(id) || media.id !== id || !trustedOrigin) return null;
      const origin = new URL(trustedOrigin);
      const blob = new URL(media.url);
      if (
        !["http:", "https:"].includes(origin.protocol) ||
        blob.protocol !== "blob:" ||
        blob.origin !== origin.origin ||
        blob.search ||
        blob.hash ||
        !z.uuid().safeParse(blob.pathname.split("/").at(-1)).success
      )
        return null;
    }
    const mediaTypes = new Map(
      adapter
        .collectMediaReferences(
          checked.payload.content,
          checked.payload.ogImageMediaId,
        )
        .map((ref) => [
          ref.id,
          {
            mime:
              parsed.data.localMedia[ref.id]?.mime ??
              (ref.kind === "video"
                ? "video/mp4"
                : ref.kind === "pdf"
                  ? "application/pdf"
                  : "image/png"),
          },
        ]),
    );
    if (
      Object.keys(
        adapter.mediaErrors(
          checked.payload.content,
          checked.payload.ogImageMediaId,
          mediaTypes,
        ),
      ).length
    )
      return null;
    return { envelope: checked.payload, localMedia: parsed.data.localMedia };
  } catch {
    return null;
  }
}

export function validateHomeLivePreview(
  raw: unknown,
  trustedOrigin: string | undefined,
): PageLivePreviewInput<"home"> | null {
  return validatePageLivePreview("home", raw, trustedOrigin);
}
