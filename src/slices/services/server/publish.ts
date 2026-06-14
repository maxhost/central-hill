import "server-only";
import { updateTag } from "@core/revalidate";
import { SERVICE_TAGS } from "../contract";

/**
 * Single place that busts the services ISR caches on publish (conventions.md →
 * "don't scatter revalidateTag calls"). The services admin actions (S12) call this
 * after a successful persist + translation enqueue.
 *
 * Listing, detail and category reads all subscribe to `service-list`, and S9 pages
 * that embed a services teaser also subscribe to it, so this single bust cascades the
 * refresh everywhere services appear. `SERVICE_TAGS.service(id)` is available for a
 * future per-service targeted bust.
 */
export function revalidateServices(): void {
  updateTag(SERVICE_TAGS.list);
}
