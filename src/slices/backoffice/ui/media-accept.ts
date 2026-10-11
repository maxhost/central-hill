import {
  DOTLOTTIE_MIME,
  IMAGE_MIMES,
  LOTTIE_MIMES,
  VIDEO_MIMES,
  canonicalMediaMime,
  isLottieMime,
} from "@core/media/mime";

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
 * - `animated` — a photo, an animated WebP, a short loop or a Lottie animation (`.json` /
 *   `.lottie`) — the Home guests-pitch side media (spec home-admin-editor S6).
 *
 * Types are the **canonical** ones (`core/media/mime`): always run a picked file through
 * `pickedFileType` first — a `.lottie` usually reports an empty `File.type`.
 */
export const MEDIA_FIELD_ACCEPT = {
  image: [...IMAGE_MIMES],
  video: [...VIDEO_MIMES],
  media: [...IMAGE_MIMES, ...VIDEO_MIMES],
  animated: [...IMAGE_MIMES, ...VIDEO_MIMES, ...LOTTIE_MIMES],
} as const satisfies Record<string, readonly string[]>;

export type MediaFieldAccept = keyof typeof MEDIA_FIELD_ACCEPT;

/**
 * The `<input type="file" accept>` attribute for a field. A dotLottie has no type the OS
 * dialog knows, so Lottie fields list the extensions too (`.json` alongside, for clarity).
 */
export function acceptAttribute(accept: MediaFieldAccept): string {
  const types: string[] = [...MEDIA_FIELD_ACCEPT[accept]];
  if (types.includes(DOTLOTTIE_MIME)) types.push(".lottie", ".json");
  return types.join(",");
}

/**
 * The canonical type of a picked file (`File.name` + `File.type`): Lottie by extension,
 * everything else as the browser reported. The same normalisation runs again server-side
 * in presign.
 */
export function pickedFileType(file: { name: string; type: string }): string {
  return canonicalMediaMime(file.name, file.type);
}

/** Which admin tile a non-image preview gets. */
export function previewLabelKey(mime: string): "media.lottie" | "media.video" {
  return isLottieMime(mime) ? "media.lottie" : "media.video";
}

/** Is a picked file's mime type one this field takes? */
export function isAcceptedType(accept: MediaFieldAccept, mime: string): boolean {
  return (MEDIA_FIELD_ACCEPT[accept] as readonly string[]).includes(mime);
}

/**
 * `backoffice` message key for a field's empty-state tile: a video-only field reads
 * "No video", every other field "No image" (as before).
 */
export function emptyStateKey(accept: MediaFieldAccept): "media.emptyVideo" | "media.empty" {
  return accept === "video" ? "media.emptyVideo" : "media.empty";
}
