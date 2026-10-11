/**
 * What each `MediaField` / `MediaGalleryField` `accept` value lets staff pick. Pure (no
 * React) so it is unit-testable. Drives both the file dialog's `accept` attribute and the
 * client-side type check on the picked file (the dialog filter is only advisory — most
 * OS pickers let you switch to "All files"). The server (`core/media` ingest) remains the
 * authority on what can be stored; these lists must stay a subset of what it allows.
 *
 * - `image` — still images (the default; covers, galleries, panels).
 * - `video` — background loops (e.g. the Home hero): MP4 / WebM only.
 * - `media` — either (galleries that mix photos and clips).
 */
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

export const MEDIA_FIELD_ACCEPT = {
  image: [...IMAGE_TYPES],
  video: [...VIDEO_TYPES],
  media: [...IMAGE_TYPES, ...VIDEO_TYPES],
} as const satisfies Record<string, readonly string[]>;

export type MediaFieldAccept = keyof typeof MEDIA_FIELD_ACCEPT;

/** The `<input type="file" accept>` attribute for a field. */
export function acceptAttribute(accept: MediaFieldAccept): string {
  return MEDIA_FIELD_ACCEPT[accept].join(",");
}

/** Is a picked file's mime type one this field takes? */
export function isAcceptedType(accept: MediaFieldAccept, mime: string): boolean {
  return (MEDIA_FIELD_ACCEPT[accept] as readonly string[]).includes(mime);
}
