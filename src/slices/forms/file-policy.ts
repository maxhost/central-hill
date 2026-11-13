/** One attachment per File field; aggregate bound leaves room for multipart request data. */
export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const MAX_TOTAL_FILE_BYTES = 3 * 1024 * 1024;
export const FORM_FILE_TYPES = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/gif": ["gif"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
} as const;
export const FORM_FILE_ACCEPT = Object.entries(FORM_FILE_TYPES).flatMap(([mime, extensions]) => [mime, ...extensions.map(extension => `.${extension}`)]).join(",");
export type FileSelectionError = "fileEmpty" | "fileTooLarge" | "fileTypeError";
/** Browser convenience only: the server also verifies the actual file bytes. */
export function fileSelectionError(file: { name: string; type: string; size: number }): FileSelectionError | null {
  if (file.size === 0) return "fileEmpty";
  if (file.size > MAX_FILE_BYTES) return "fileTooLarge";
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  const match = Object.entries(FORM_FILE_TYPES).find(([, extensions]) => (extensions as readonly string[]).includes(extension ?? ""));
  if (!match || (file.type && file.type !== match[0])) return "fileTypeError";
  return null;
}
