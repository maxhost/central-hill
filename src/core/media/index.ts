/**
 * Public surface of `core/media`. R2-backed media reads + the responsive image
 * component, plus the presigned upload pipeline (ADR 0018, server-only — consumed by
 * the `requireStaff`-gated media admin actions).
 */
export type { MediaAsset } from "./queries";
export { loadMedia } from "./queries";
export type { MediaImageData } from "./image";
export { MediaImage, mediaUrl } from "./image";
export type { FinalizeInput, PresignInput, PresignResult } from "./server/ingest";
export { deleteMedia, finalizeUpload, presignUpload } from "./server/ingest";
