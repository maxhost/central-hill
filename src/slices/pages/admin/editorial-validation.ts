import { z } from "zod";
import { getEditorialAdapter } from "../server/editorial-adapters";
import { sharedEnvelope } from "../editorial-content";
import type { EditorialPageKey, PageEnvelope } from "../editorial-types";

export { homeDraftSchema } from "../adapters/home";
const envelope = <K extends EditorialPageKey>(key: K, publication: boolean) =>
  z
    .object({
      schemaVersion: z.literal(1),
      content: publication
        ? getEditorialAdapter(key).publishSchema
        : getEditorialAdapter(key).draftSchema,
      ogImageMediaId: z.uuid().nullable(),
    })
    .strict();
export function validateEnvelope<K extends EditorialPageKey = "home">(
  raw: unknown,
  publication = false,
  key: K = "home" as K,
): { payload?: PageEnvelope<K>; errors: Record<string, string> } {
  if (JSON.stringify(raw)?.length > 200_000)
    return { errors: { _source: "Page content is too large." } };
  const parsed = envelope(key, publication).safeParse(raw);
  if (!parsed.success)
    return {
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path[0] === "content"
            ? issue.path.slice(1).join(".")
            : issue.path[0] === "ogImageMediaId"
              ? "og_image_media_id"
              : issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  const payload = parsed.data as PageEnvelope<K>;
  return {
    payload,
    errors: getEditorialAdapter(key).identityErrors(payload.content),
  };
}
export async function validateDraftMutation<
  K extends EditorialPageKey = "home",
>(
  payload: PageEnvelope<K>,
  previous: PageEnvelope<K>,
  locale: string,
  publication = false,
  key: K = "home" as K,
) {
  const checked = validateEnvelope(payload, publication, key);
  if (!checked.payload || Object.keys(checked.errors).length) return checked;
  if (
    locale !== "en" &&
    sharedEnvelope(payload, getEditorialAdapter(key).descriptor) !==
      sharedEnvelope(previous, getEditorialAdapter(key).descriptor)
  )
    return {
      errors: {
        _source: "Shared fields changed. Reload the language template.",
      },
    };
  const identities = getEditorialAdapter(key).identityErrors(
    payload.content,
    previous.content,
  );
  if (Object.keys(identities).length) return { errors: identities };
  const content =
    locale === "en"
      ? getEditorialAdapter(key).retireIds(
          checked.payload.content,
          previous.content,
        )
      : checked.payload.content;
  const { loadMedia } = await import("@core/media");
  const assets = await loadMedia(
    getEditorialAdapter(key)
      .collectMediaReferences(content, payload.ogImageMediaId)
      .map((ref) => ref.id),
  );
  const errors = getEditorialAdapter(key).mediaErrors(
    content,
    payload.ogImageMediaId,
    assets,
  );
  return { payload: { ...checked.payload, content }, errors };
}
