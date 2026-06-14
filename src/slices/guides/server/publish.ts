import "server-only";
import { updateTag } from "@core/revalidate";
import { GUIDE_TAGS } from "../contract";

/**
 * Single place that busts the guides ISR caches on publish (conventions.md →
 * "don't scatter revalidateTag calls"). The guides admin actions (S12) call this
 * after a successful persist + translation enqueue.
 *
 * The index and every guide-page detail subscribe to `guide-list`, so this single
 * bust refreshes everywhere guides appear (including a future S9 "Best of" teaser
 * that adds `GUIDE_TAGS.list` to its own cached reads). `GUIDE_TAGS.page(id)` is
 * reserved for a future per-page targeted bust.
 */
export function revalidateGuides(): void {
  updateTag(GUIDE_TAGS.list);
}
