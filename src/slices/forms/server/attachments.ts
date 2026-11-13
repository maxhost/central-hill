import { Buffer } from "node:buffer";
import sharp from "sharp";
import type { EmailAttachment } from "@core/email";
import { MAX_TOTAL_FILE_BYTES, fileSelectionError } from "../file-policy";
import type { FormBlueprint, FormFileValue } from "../types";
import { orderedFields } from "../layout";

export interface ValidatedAttachments {
  files: Record<string, FormFileValue>;
  attachments: EmailAttachment[];
  fieldErrors: Record<string, string>;
}

const fileErrors = {
  fileEmpty: "Choose a non-empty file.",
  fileTooLarge: "The file must be 3 MiB or smaller.",
  fileTypeError: "Choose a PDF, JPEG, PNG, GIF, WebP or AVIF file.",
};

/** Strip paths, control characters and dangerous filename punctuation; retain readable Unicode. */
function safeFilename(name: string): string {
  const basename = name.normalize("NFC").split(/[\\/]/).at(-1) ?? "attachment";
  const cleaned = basename.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069<>:"|?*]/g, "_").replace(/^[.\s]+|[.\s]+$/g, "");
  const dot = cleaned.lastIndexOf(".");
  const extension = cleaned.slice(dot + 1).toLowerCase();
  return `${cleaned.slice(0, dot).slice(0, 150) || "attachment"}.${extension}`;
}

/** Verify actual content, not just a browser-provided MIME or extension. */
async function contentType(bytes: Buffer): Promise<string | null> {
  if (/^%PDF-(?:1\.[0-7]|2\.0)\s/.test(bytes.subarray(0, 16).toString("ascii"))) {
    return /%%EOF\s*$/.test(bytes.subarray(-1024).toString("ascii")) ? "application/pdf" : null;
  }
  try {
    // Metadata reads headers without decoding pixels; no extra authoring resolution limit.
    const metadata = await sharp(bytes, { limitInputPixels: false }).metadata();
    const types: Record<string, string> = { jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };
    if (metadata.format === "heif" && metadata.compression === "av1") return "image/avif";
    return metadata.format ? types[metadata.format] ?? null : null;
  } catch {
    return null;
  }
}

/** Authenticated caller only. Validate everything before capturing a test or contacting email. */
export async function validateAttachments(definition: FormBlueprint, uploads?: FormData): Promise<ValidatedAttachments> {
  const result: ValidatedAttachments = { files: {}, attachments: [], fieldErrors: {} };
  if (uploads === undefined) return result;
  if (!(uploads instanceof FormData)) {
    result.fieldErrors.files = "Choose valid attached files.";
    return result;
  }
  const visualFields = orderedFields(definition).filter(field => field.type === "file");
  const fields = new Set(visualFields.map(field => field.id));
  const candidates: { id: string; file: File }[] = [];
  const seen = new Set<string>();
  let total = 0;
  for (const [id, entry] of uploads.entries()) {
    if (!fields.has(id)) { result.fieldErrors[id] = "Unexpected attachment field."; continue; }
    if (seen.has(id)) { result.fieldErrors[id] = "Choose only one file for this field."; continue; }
    seen.add(id);
    if (typeof entry === "string") { result.fieldErrors[id] = "Choose an attached file instead of a text answer."; continue; }
    const issue = fileSelectionError(entry);
    if (issue) { result.fieldErrors[id] = fileErrors[issue]; continue; }
    total += entry.size;
    candidates.push({ id, file: entry });
  }
  if (total > MAX_TOTAL_FILE_BYTES) {
    for (const { id } of candidates) result.fieldErrors[id] = "Attachments together must be 3 MiB or smaller.";
  }
  if (Object.keys(result.fieldErrors).length) return result;
  // Bound bytes before allocating buffers. Build output only when every file is valid.
  const byId = new Map(candidates.map(candidate => [candidate.id, candidate]));
  for (const field of visualFields) {
    const candidate = byId.get(field.id);
    if (!candidate) continue;
    const { id, file } = candidate;
    const bytes = Buffer.from(await file.arrayBuffer());
    const detected = await contentType(bytes);
    const extensionType = file.name.toLowerCase().endsWith(".pdf") ? "application/pdf"
      : /\.jpe?g$/i.test(file.name) ? "image/jpeg"
      : `image/${file.name.split(".").at(-1)?.toLowerCase()}`;
    if (!detected || detected !== extensionType || (file.type && detected !== file.type)) {
      result.fieldErrors[id] = "The file content does not match a supported PDF or image type.";
      continue;
    }
    const name = safeFilename(file.name);
    result.files[id] = { kind: "file", name, type: detected, size: file.size };
    result.attachments.push({ filename: name, content: bytes.toString("base64"), contentType: detected });
  }
  if (Object.keys(result.fieldErrors).length) { result.files = {}; result.attachments = []; }
  return result;
}
