/**
 * `page_content` row validation (slice `pages`, ADR 0012).
 *
 * A discriminated union on `key` so each row's `data` is validated against the
 * correct fixed page schema. `data` holds SOURCE-locale values; target locales
 * live in the `translation` table keyed entity_type='page_content',
 * field='block:<dot.path>'.
 */
import { z } from "zod";
import { mediaId, pageStatus, uuid } from "@core/validation/primitives";
import {
  aboutSchema,
  guestSchema,
  homeSchema,
  ownersSchema,
  realEstateSchema,
} from "./schemas";

const row = <K extends string, D extends z.ZodType>(key: K, data: D) =>
  z.object({
    id: uuid.optional(),
    key: z.literal(key),
    status: pageStatus,
    og_image_media_id: mediaId.optional(),
    data,
  });

/** Full `page_content` row, with `data` validated per `key`. */
export const pageContentSchema = z.discriminatedUnion("key", [
  row("home", homeSchema),
  row("owners", ownersSchema),
  row("real_estate", realEstateSchema),
  row("about", aboutSchema),
  row("guest", guestSchema),
]);

export type PageContent = z.infer<typeof pageContentSchema>;
