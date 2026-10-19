import type { PageEditorBridgeMessage } from "../page-editor-types";

export const PAGE_EDITOR_CHANNEL = "central-hill-page-editor" as const;

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
