import "server-only";
import { updateTag } from "@core/revalidate";
import { FAQ_TAGS } from "../contract";

/**
 * Single place that busts the FAQ ISR cache on publish (conventions.md → "don't
 * scatter revalidateTag calls"). The FAQ admin actions (S12) call this after a
 * successful persist + translation enqueue.
 *
 * FAQ groups have no routes of their own — they are embedded by S9 pages, whose
 * cached reads also subscribe to `FAQ_TAGS.list`, so busting it here cascades the
 * refresh of every page that renders an FAQ section.
 */
export function revalidateFaq(): void {
  updateTag(FAQ_TAGS.list);
}
