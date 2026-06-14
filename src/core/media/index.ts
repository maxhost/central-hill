/**
 * Public surface of `core/media`. R2-backed media reads + the responsive image
 * component. The S3/R2 upload pipeline (admin-side) lands with the media admin.
 */
export type { MediaAsset } from "./queries";
export { loadMedia } from "./queries";
export type { MediaImageData } from "./image";
export { MediaImage, mediaUrl } from "./image";
