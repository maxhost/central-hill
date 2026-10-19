import { z } from "zod";
import { homeSchema } from "../schemas/home";
import { homeIdentityErrors, retireHomeIds } from "../home-content";
import { sharedEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";
import { homeMediaErrors, homeMediaReferences } from "./home-media-validation";

// Drafts may leave the required CTA text/link unfinished. All other constraints,
// including media UUIDs, list arity and maximum lengths, remain authoritative.
const unfinishedUrl = z.union([z.literal(""), z.url()]);
export const homeDraftSchema = homeSchema.extend({
  hero: homeSchema.shape.hero.extend({ cta_primary: homeSchema.shape.hero.shape.cta_primary.extend({ url: unfinishedUrl }) }),
  guests_pitch: homeSchema.shape.guests_pitch.extend({ cta: homeSchema.shape.guests_pitch.shape.cta.extend({ url: unfinishedUrl }) }),
});
const envelope = (publication: boolean) => z.object({ schemaVersion: z.literal(1), content: publication ? homeSchema : homeDraftSchema, ogImageMediaId: z.uuid().nullable() }).strict();
export function validateEnvelope(raw: unknown, publication = false): { payload?: PageEnvelope; errors: Record<string, string> } {
  if (JSON.stringify(raw)?.length > 200_000) return { errors: { _source: "Page content is too large." } };
  const parsed = envelope(publication).safeParse(raw);
  if (!parsed.success) return { errors: Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0] === "content" ? issue.path.slice(1).join(".") : issue.path[0] === "ogImageMediaId" ? "og_image_media_id" : issue.path.join("."), issue.message])) };
  const payload = parsed.data as PageEnvelope;
  return { payload, errors: homeIdentityErrors(payload.content) };
}
export async function validateDraftMutation(payload: PageEnvelope, previous: PageEnvelope, locale: string, publication = false) {
  const checked = validateEnvelope(payload, publication);
  if (!checked.payload || Object.keys(checked.errors).length) return checked;
  if (locale !== "en" && sharedEnvelope(payload) !== sharedEnvelope(previous)) return { errors: { _source: "Shared fields changed. Reload the language template." } };
  const identities = homeIdentityErrors(payload.content, previous.content);
  if (Object.keys(identities).length) return { errors: identities };
  const content = locale === "en" ? retireHomeIds(checked.payload.content, previous.content) : checked.payload.content;
  const { loadMedia } = await import("@core/media");
  const assets = await loadMedia(homeMediaReferences(content, payload.ogImageMediaId).map(ref => ref.id));
  const errors = homeMediaErrors(content, payload.ogImageMediaId, assets);
  return { payload: { ...checked.payload, content }, errors };
}
