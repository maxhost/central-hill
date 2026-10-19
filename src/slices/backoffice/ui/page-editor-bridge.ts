import type { PageEditorBridgeMessage } from "../page-editor-types";

export const PAGE_EDITOR_CHANNEL = "central-hill-page-editor" as const;

const MAX_PREVIEW_BYTES = 256 * 1024;

/** Only bounded JSON data crosses the private preview bridge. */
function boundedPreviewPayload(payload: unknown): boolean {
  let nodes = 0;
  const ancestors = new Set<object>();
  function visit(value: unknown, depth: number): boolean {
    if (++nodes > 20000 || depth > 32) return false;
    if (value === null || typeof value === "boolean" || typeof value === "string") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (!value || typeof value !== "object" || ancestors.has(value)) return false;
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
    ancestors.add(value);
    const valid = Object.values(value).every(child => visit(child, depth + 1));
    ancestors.delete(value);
    return valid;
  }
  try {
    return visit(payload, 0) && new TextEncoder().encode(JSON.stringify(payload)).byteLength <= MAX_PREVIEW_BYTES;
  } catch {
    return false;
  }
}

/** A select is bidirectional: the receiver never echoes it. Ready comes from the preview. */
export function readPageEditorMessage(
  event: Pick<MessageEvent, "origin" | "source" | "data">,
  expected: { origin: string; source: MessageEventSource | null; instance: string; bindingIds: readonly string[] },
): PageEditorBridgeMessage | null {
  if (!expected.source || event.source !== expected.source || event.origin !== expected.origin) return null;
  const data: unknown = event.data;
  if (!data || typeof data !== "object") return null;
  const message = data as Record<string, unknown>;
  if (message.channel !== PAGE_EDITOR_CHANNEL || message.instance !== expected.instance || !expected.instance) return null;
  if (message.type === "ready" && message.bindingId === undefined) {
    return { channel: PAGE_EDITOR_CHANNEL, instance: expected.instance, type: "ready" };
  }
  if (message.type === "select" && typeof message.bindingId === "string" && expected.bindingIds.includes(message.bindingId)) {
    return { channel: PAGE_EDITOR_CHANNEL, instance: expected.instance, type: "select", bindingId: message.bindingId };
  }
  if (message.type === "preview" && Number.isSafeInteger(message.revision) && (message.revision as number) >= 0
    && Object.hasOwn(message, "payload") && boundedPreviewPayload(message.payload)) {
    return { channel: PAGE_EDITOR_CHANNEL, instance: expected.instance, type: "preview", revision: message.revision as number, payload: message.payload };
  }
  return null;
}

export function pageEditorPreviewUrl(url: string, instance: string, version: number): string {
  const [path = "", hash] = url.split("#", 2);
  const queryIndex = path.indexOf("?");
  const query = new URLSearchParams(queryIndex === -1 ? "" : path.slice(queryIndex + 1));
  query.set("instance", instance);
  query.set("editorVersion", String(version));
  return `${queryIndex === -1 ? path : path.slice(0, queryIndex)}?${query}${hash ? `#${hash}` : ""}`;
}
