/**
 * Media mime vocabulary (kernel — `core/media`). Pure and dependency-free, so both the
 * server ingest and the admin's client-side picker (slice `backoffice`) read the same
 * canonical types. Spec home-admin-editor S6 adds Lottie as a third media kind.
 *
 * **Lottie has no reliable browser mime.** A `.json` file arrives as `application/json`,
 * but a `.lottie` (dotLottie — a zip) usually arrives with an **empty** `File.type`, or
 * as `application/zip` / `application/octet-stream`. So Lottie is identified by its file
 * extension and given a canonical mime here — client-side before the type check and the
 * reservation, and again server-side in presign (never trusting the client). The
 * canonical mime is what gets signed into the R2 PUT, so it is also the `Content-Type`
 * R2 serves the object with and the `mime` recorded on the `media_asset` row.
 */

export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const VIDEO_MIMES = ["video/mp4", "video/webm"] as const;

/** Lottie JSON (`.json`) — the browser's own type for the file, kept as-is. */
export const LOTTIE_JSON_MIME = "application/json";
/** dotLottie (`.lottie`, a zip) — the type the dotLottie format documents for itself. */
export const DOTLOTTIE_MIME = "application/zip+dotlottie";
export const LOTTIE_MIMES = [LOTTIE_JSON_MIME, DOTLOTTIE_MIME] as const;

/** The extension each Lottie mime must be stored under (the r2 key keeps describing the bytes). */
export const LOTTIE_EXTENSION: Record<(typeof LOTTIE_MIMES)[number], string> = {
  [LOTTIE_JSON_MIME]: "json",
  [DOTLOTTIE_MIME]: "lottie",
};

export function isLottieMime(mime: string | null | undefined): boolean {
  return mime === LOTTIE_JSON_MIME || mime === DOTLOTTIE_MIME;
}

/** Lowercased extension of a filename, without the dot (`""` when there is none). */
export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot < 0 ? "" : filename.slice(dot + 1).toLowerCase();
}

/**
 * The canonical mime for an uploaded file: Lottie by extension (`.lottie` → dotLottie,
 * `.json` → Lottie JSON), whatever the browser reported; everything else as reported.
 */
export function canonicalMediaMime(filename: string, reported: string): string {
  switch (fileExtension(filename)) {
    case "lottie":
      return DOTLOTTIE_MIME;
    case "json":
      return LOTTIE_JSON_MIME;
    default:
      return reported;
  }
}
