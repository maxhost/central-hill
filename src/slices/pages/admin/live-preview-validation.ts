import { z } from "zod";
import { IMAGE_MIMES, VIDEO_MIMES, LOTTIE_MIMES } from "@core/media/mime";
import type { HomeLivePreviewInput } from "../editorial-types";
import { validateEnvelope } from "./editorial-validation";
import { homeMediaErrors, homeMediaReferences } from "./home-media-validation";

const localPreview = z.object({
  id: z.uuid(), url: z.string().max(2048),
  width: z.number().int().positive().max(20000).nullable(),
  height: z.number().int().positive().max(20000).nullable(),
  mime: z.enum([...IMAGE_MIMES, ...VIDEO_MIMES, ...LOTTIE_MIMES]),
  name: z.string().max(255).optional(),
}).strict();
const request = z.object({ envelope: z.unknown(), localMedia: z.record(z.uuid(), localPreview).refine(value => Object.keys(value).length <= 6) }).strict();

/** Only in-memory, same-origin blob references are accepted by this read path. */
export function validateHomeLivePreview(raw: unknown, trustedOrigin: string | undefined): HomeLivePreviewInput | null {
  try {
    if (JSON.stringify(raw).length > 230_000) return null;
    const parsed = request.safeParse(raw);
    if (!parsed.success) return null;
    const checked = validateEnvelope(parsed.data.envelope);
    if (!checked.payload || Object.keys(checked.errors).length) return null;
    const references = new Set(homeMediaReferences(checked.payload.content, checked.payload.ogImageMediaId).map(ref => ref.id));
    for (const [id, media] of Object.entries(parsed.data.localMedia)) {
      if (!references.has(id) || media.id !== id || !trustedOrigin) return null;
      const origin = new URL(trustedOrigin);
      const blob = new URL(media.url);
      if (!["http:", "https:"].includes(origin.protocol) || blob.protocol !== "blob:" || blob.origin !== origin.origin || blob.search || blob.hash || !z.uuid().safeParse(blob.pathname.split("/").at(-1)).success) return null;
    }
    const mediaTypes = new Map(homeMediaReferences(checked.payload.content, checked.payload.ogImageMediaId).map(ref => [ref.id, {
      mime: parsed.data.localMedia[ref.id]?.mime ?? (ref.kind === "video" ? "video/mp4" : "image/png"),
    }]));
    if (Object.keys(homeMediaErrors(checked.payload.content, checked.payload.ogImageMediaId, mediaTypes)).length) return null;
    return { envelope: checked.payload, localMedia: parsed.data.localMedia };
  } catch { return null; }
}
